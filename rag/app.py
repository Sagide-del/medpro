"""Private ingestion/retrieval service. PostgreSQL is the authorization catalog.

Run one worker per persistent Chroma volume. Source PDFs are never publicly served.
Disabling RAG_ENABLED in the Node app rolls back retrieval without deleting records.
"""
import hashlib
import hmac
import logging
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from pypdf import PdfReader
from chunking import chunk_record, page_chunks, prefixed

DATA = Path(os.environ.get("RAG_DATA_DIR", "/data"))
MODEL = "intfloat/multilingual-e5-base"
lock = threading.RLock()
stop = threading.Event()
_model = None
_collection = None


def connect():
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


def collection():
    global _collection
    if _collection is None:
        import chromadb
        _collection = chromadb.PersistentClient(path=str(DATA / "chroma")).get_or_create_collection(
            "medpro-e5-base-v1", metadata={"hnsw:space": "cosine"})
    return _collection


def model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL)
        _model.max_seq_length = 512
    return _model


def embed(texts, kind):
    # Both ingestion and retrieval pass through this function; prefix omission
    # cannot silently switch the query into a different embedding space.
    inputs = prefixed(texts, kind)
    encoder = model()
    if any(len(encoder.tokenizer.encode(text)) > 512 for text in inputs):
        raise ValueError("Embedding input exceeds 512 tokens; shorten the query or chunk")
    return encoder.encode(inputs, normalize_embeddings=True, batch_size=16).tolist()


def ingest(document):
    path = DATA / "sources" / f"{document['id']}.pdf"
    if hashlib.sha256(path.read_bytes()).hexdigest() != document["file_hash"]:
        raise ValueError("Source file checksum mismatch; upload a verified document")
    reader = PdfReader(path)
    if reader.is_encrypted:
        raise ValueError("Encrypted PDF: upload an unlocked, authorized copy")
    if not 1 <= len(reader.pages) <= 500:
        raise ValueError("Upload a chapter or document containing 1-500 pages")
    pages = []
    for index, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        if len(text.strip()) < 30:
            raise ValueError(f"PDF page {index} has insufficient text. Run OCR or remove blank pages and upload a new version")
        pages.append(text)
    with lock:
        store = collection()
        store.delete(where={"document_id": str(document["id"])})
        count = 0
        for page_number, text in enumerate(pages, 1):
            chunks = list(page_chunks(text, model().tokenizer))
            for offset in range(0, len(chunks), 16):
                batch = chunks[offset:offset + 16]
                records = [chunk_record(document, page_number, offset + n, chunk) for n, chunk in enumerate(batch)]
                store.upsert(ids=[r[0] for r in records], documents=batch,
                             metadatas=[r[1] for r in records], embeddings=embed(batch, "passage"))
                count += len(batch)
    return len(pages), count


def process_next():
    # A transaction-scoped claim survives API restarts. Interrupted jobs are
    # retried after 30 minutes; idempotent upserts prevent duplicate chunks.
    with connect() as db:
        db.execute("UPDATE rag_sources SET status='queued' WHERE status='indexing' AND updated_at < now()-interval '30 minutes'")
        document = db.execute("SELECT * FROM rag_sources WHERE status='queued' AND approved_by IS NOT NULL ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1").fetchone()
        if not document:
            return False
        db.execute("UPDATE rag_sources SET status='indexing',error=NULL,updated_at=now() WHERE id=%s", [document["id"]])
    try:
        page_count, chunk_count = ingest(document)
        with connect() as db:
            db.execute("UPDATE rag_sources SET status='ready',page_count=%s,chunk_count=%s,updated_at=now() WHERE id=%s AND status='indexing'",
                       [page_count, chunk_count, document["id"]])
    except Exception as exc:
        logging.exception("Ingestion failed for source %s", document["id"])
        message = str(exc) if isinstance(exc, ValueError) else "Indexing failed. Check retrieval service logs, then retry."
        with connect() as db:
            db.execute("UPDATE rag_sources SET status='failed',error=%s,updated_at=now() WHERE id=%s AND status='indexing'",
                       [message[:500], document["id"]])
    return True


def worker():
    while not stop.is_set():
        try:
            if process_next():
                continue
        except Exception:
            logging.exception("Source queue unavailable")
        stop.wait(5)


@asynccontextmanager
async def lifespan(_app):
    if len(os.environ.get("RAG_SERVICE_KEY", "")) < 32:
        raise RuntimeError("Set a private RAG_SERVICE_KEY of at least 32 characters")
    (DATA / "sources").mkdir(parents=True, exist_ok=True)
    stop.clear()
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    yield
    stop.set()
    thread.join(timeout=5)


def authorize(request: Request):
    expected = f"Bearer {os.environ.get('RAG_SERVICE_KEY', '')}"
    if not os.environ.get("RAG_SERVICE_KEY") or not hmac.compare_digest(request.headers.get("authorization", ""), expected):
        raise HTTPException(401, "Unauthorized")


app = FastAPI(lifespan=lifespan, dependencies=[Depends(authorize)], docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/health")
def health():
    with connect() as db:
        db.execute("SELECT 1 FROM rag_sources LIMIT 1")
    with lock:
        collection().count()
    return {"ok": True, "model_loaded": _model is not None, "embedding_model": MODEL}


@app.put("/files/{document_id}")
async def store_file(document_id: UUID, request: Request):
    data = bytearray()
    async for block in request.stream():
        data.extend(block)
        if len(data) > 20 * 1024 * 1024:
            raise HTTPException(413, "PDF exceeds 20 MB")
    if not data.startswith(b"%PDF-"):
        raise HTTPException(400, "PDF required")
    with connect() as db:
        row = db.execute("SELECT file_hash FROM rag_sources WHERE id=%s AND status='uploading'", [document_id]).fetchone()
    if not row or row["file_hash"] != hashlib.sha256(data).hexdigest():
        raise HTTPException(409, "Upload not registered or checksum mismatch")
    path = DATA / "sources" / f"{document_id}.pdf"
    temporary = path.with_suffix(".tmp")
    temporary.write_bytes(data)
    temporary.replace(path)
    return {"stored": True}


class Retrieval(BaseModel):
    document_ids: list[UUID] = Field(min_length=1, max_length=10000)
    query: str = Field(min_length=1, max_length=1500)
    limit: int = Field(default=12, ge=1, le=24)


@app.post("/retrieve")
def retrieve(body: Retrieval):
    # Recheck authoritative state to exclude sources withdrawn after the Node
    # authorization query; similarity never grants access to another document.
    with connect() as db:
        rows = db.execute("SELECT id FROM rag_sources WHERE id=ANY(%s::uuid[]) AND status='ready' AND approved_by IS NOT NULL", [body.document_ids]).fetchall()
    ids = [str(row["id"]) for row in rows]
    if not ids:
        return {"chunks": []}
    with lock:
        result = collection().query(query_embeddings=embed([body.query], "query"),
                                    where={"document_id": {"$in": ids}}, n_results=body.limit,
                                    include=["documents", "metadatas", "distances"])
    chunks = []
    for text, metadata, distance in zip(result["documents"][0], result["metadatas"][0], result["distances"][0]):
        # This is an operational threshold, not a claim of clinical grounding.
        if distance <= float(os.environ.get("RAG_MAX_DISTANCE", "0.25")):
            chunks.append({**metadata, "text": text, "distance": distance})
    return {"chunks": chunks}
