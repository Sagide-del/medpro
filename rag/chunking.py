import hashlib
import re


def prefixed(texts, kind):
    if kind not in ("passage", "query"):
        raise ValueError("Embedding kind must be passage or query")
    return [f"{kind}: {text}" for text in texts]


def page_chunks(text, tokenizer, budget=350, overlap=60):
    """Keep paragraph boundaries when possible; never truncate a long paragraph."""
    if not 0 <= overlap < budget:
        raise ValueError("Invalid chunk overlap")
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    current = []
    for paragraph in paragraphs:
        tokens = tokenizer.encode(paragraph, add_special_tokens=False)
        if current and len(current) + len(tokens) > budget:
            yield tokenizer.decode(current, skip_special_tokens=True)
            current = current[-overlap:] if overlap else []
        current.extend(tokens)
        while len(current) > budget:
            yield tokenizer.decode(current[:budget], skip_special_tokens=True)
            current = current[budget - overlap:]
    if current:
        yield tokenizer.decode(current, skip_special_tokens=True)


def chunk_record(document, page, ordinal, text):
    text_hash = hashlib.sha256(text.encode()).hexdigest()
    chunk_id = hashlib.sha256(f"{document['id']}:{page}:{ordinal}:{text_hash}".encode()).hexdigest()
    return chunk_id, {
        "document_id": str(document["id"]), "chunk_id": chunk_id,
        "chunk_hash": text_hash, "source_document": document["filename"],
        "page_number": page, "source_type": document["source_type"],
        "certification_level": document["program"], "clinical_subject": document["subject"],
        "version": document["version"], "scope_key": document["scope_key"],
        "embedding_model": "intfloat/multilingual-e5-base",
    }
