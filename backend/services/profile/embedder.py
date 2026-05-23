import hashlib
import uuid
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

from shared.config import settings

_client: chromadb.ClientAPI | None = None
_model: SentenceTransformer | None = None


def _get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.Client()
    return _client


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    words = text.split()
    if len(words) <= chunk_size:
        return [text] if text.strip() else []

    chunks: list[str] = []
    start = 0
    while start < len(words):
        chunk_words = words[start : start + chunk_size]
        chunks.append(" ".join(chunk_words))
        start += chunk_size - overlap

    return [c for c in chunks if c.strip()]


async def embed_cv(
    cv_id: uuid.UUID,
    user_id: str,
    sections: list[dict[str, Any]],
    db,
) -> None:
    """
    Chunk CV sections, embed them, and upsert into ChromaDB `cv_chunks`.

    Flow:
    1. Delete all existing chunks for this user (cv_id changes on re-upload)
    2. Chunk each section's content
    3. Embed and upsert with user_id + cv_id metadata
    4. Mark CV.embedding_status = "done"
    """
    client = _get_chroma_client()
    model = _get_model()

    coll_name = "cv_chunks"

    # Delete existing user chunks
    try:
        existing = client.get_collection(name=coll_name)
        existing.delete(where={"user_id": user_id})
    except Exception:
        pass

    # Prepare chunks
    records: list[tuple[str, dict[str, Any]]] = []
    for section in sections:
        content = section.get("content", "")
        if not content.strip():
            continue

        section_type = section.get("section_type", "other")
        chunks = _chunk_text(content)
        for chunk in chunks:
            chunk_id = hashlib.md5(chunk.encode()).hexdigest()[:16]
            records.append((chunk, {
                "chunk_id": chunk_id,
                "user_id": user_id,
                "cv_id": str(cv_id),
                "section_type": section_type,
                "order_index": section.get("order_index", 0),
            }))

    if not records:
        # No text to embed — mark done and return
        from shared.models import CV
        db.query(CV).filter(CV.id == cv_id).update(
            {"embedding_status": "done"}
        )
        db.commit()
        return

    # Batch embed
    texts, metadatas = zip(*records)
    import numpy as np
    embeddings = model.encode(list(texts), show_progress_bar=False)
    ids = [f"{cv_id}-{i}" for i in range(len(records))]

    # Upsert to ChromaDB
    coll = client.get_or_create_collection(name=coll_name)
    coll.upsert(ids=ids, documents=list(texts), metadatas=list(metadatas), embeddings=embeddings.tolist())

    # Update embedding_status in DB
    from shared.models import CV
    db.query(CV).filter(CV.id == cv_id).update({"embedding_status": "done"})
    db.commit()
