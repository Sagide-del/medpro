"""Local real-model smoke test. Uses synthetic text, not clinical teaching material."""
import os
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parent
os.environ.setdefault("RAG_DATA_DIR", str(ROOT / ".data" / "smoke"))
os.environ.setdefault("HF_HOME", str(ROOT / ".data" / "models"))
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
from dotenv import load_dotenv
load_dotenv(ROOT.parent / "server" / ".env.txt")
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
import hashlib
import app
print('Loaded retrieval service; connecting to the local integration database', flush=True)


def pdf(path, text):
    writer = PdfWriter()
    page = writer.add_blank_page(width=600, height=800)
    font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
    page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
    stream = DecodedStreamObject()
    stream.set_data(f"BT /F1 12 Tf 30 700 Td ({text}) Tj ET".encode())
    page[NameObject("/Contents")] = writer._add_object(stream)
    writer.write(path)


ids = []
paths = []
(app.DATA / "sources").mkdir(parents=True, exist_ok=True)
try:
    with app.connect() as db:
        user = db.execute("SELECT user_id FROM users LIMIT 1").fetchone()["user_id"]
        for program in ("EMT", "Paramedic"):
            identifier = uuid4()
            path = app.DATA / "sources" / f"{identifier}.pdf"
            paths.append(path)
            pdf(path, f"Synthetic {program} training source. This test document discusses classroom learning and study organisation, not patient treatment.")
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            row = db.execute("""INSERT INTO rag_sources(id,scope_key,filename,file_hash,source_type,program,subject,version,status,created_by,approved_by)
                VALUES(%s,%s,'synthetic.pdf',%s,'textbook',%s,'Synthetic testing','1','indexing',%s,%s) RETURNING *""",
                             [identifier, f"test:{identifier}", digest, program, user, user]).fetchone()
            ids.append(identifier)
            print(f'Indexing synthetic {program} PDF with e5 (first run downloads model weights)', flush=True)
            pages, chunks = app.ingest(row)
            assert pages == 1 and chunks >= 1
            db.execute("UPDATE rag_sources SET status='ready' WHERE id=%s", [identifier])
    # The request's allowed document IDs are applied inside the actual Chroma query.
    result = app.retrieve(app.Retrieval(document_ids=[ids[0]], query="classroom learning and study organisation", limit=5))
    assert result["chunks"], "Real e5 retrieval returned no relevant synthetic passages"
    assert all(chunk["document_id"] == str(ids[0]) and chunk["page_number"] == 1 for chunk in result["chunks"])
    with app.connect() as db:
        db.execute("UPDATE rag_sources SET status='withdrawn' WHERE id=%s", [ids[0]])
    assert app.retrieve(app.Retrieval(document_ids=[ids[0]], query="classroom learning"))["chunks"] == []
    print("PASS: real PDF extraction, multilingual-e5 embeddings, Chroma indexing/retrieval, document filter, page citations, withdrawal")
finally:
    if ids:
        with app.connect() as db:
            db.execute("DELETE FROM rag_sources WHERE id=ANY(%s::uuid[])", [ids])
        with app.lock:
            app.collection().delete(where={"document_id": {"$in": [str(value) for value in ids]}})
    for path in paths:
        if path.resolve().is_relative_to((ROOT / ".data").resolve()):
            path.unlink(missing_ok=True)
