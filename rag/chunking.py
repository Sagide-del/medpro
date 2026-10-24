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


def chapter_starts(reader):
    """Use PDF bookmarks when available; missing bookmarks get a clear fallback."""
    starts = {}

    def visit(entries):
        for entry in entries:
            if isinstance(entry, list):
                visit(entry)
                continue
            try:
                page = reader.get_destination_page_number(entry) + 1
                title = str(entry.title).strip()[:200]
                if title and 1 <= page <= len(reader.pages):
                    starts.setdefault(page, title)
            except (AttributeError, TypeError, ValueError, KeyError):
                continue
    try:
        visit(reader.outline)
    except (AttributeError, TypeError, ValueError, KeyError):
        pass
    if 1 not in starts:
        starts[1] = "Opening pages" if starts else "Book content (no PDF chapter bookmarks)"
    return sorted(starts.items())


def chapter_for_page(starts, page):
    return next((title for start, title in reversed(starts) if start <= page), "Book content")
