import os

import chromadb
from sentence_transformers import SentenceTransformer

from shared.config import settings


_client = None
_model = None


def _get_client():
    global _client
    if _client is None:
        chroma_path = settings.chroma_db_path
        os.makedirs(chroma_path, exist_ok=True)
        _client = chromadb.PersistentClient(path=chroma_path)
    return _client


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def query_cv(user_id: str, query_text: str, n: int = 5) -> str:
    """
    Query ChromaDB for top-n CV chunks relevant to query_text.
    Filters by user_id metadata so users never see each other's data.
    Returns concatenated context string.
    """
    try:
        client = _get_client()
        collection = client.get_or_create_collection(
            name="cv_chunks",
            metadata={"description": "CV chunks indexed by user"},
        )

        # Embed the query
        model = _get_model()
        query_embedding = model.encode([query_text]).tolist()

        # Search with user_id filter
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n,
            where={"user_id": user_id},
            include=["documents", "metadatas"],
        )

        # Combine results
        if not results or not results.get("documents") or not results["documents"][0]:
            return ""

        chunks = results["documents"][0]
        metadatas = results.get("metadatas", [[]])[0]

        # Format as context
        context_parts = []
        for i, (chunk, meta) in enumerate(zip(chunks, metadatas)):
            section_type = meta.get("section_type", "unknown") if meta else "unknown"
            context_parts.append(f"[{section_type}]:\n{chunk}")

        return "\n\n---\n\n".join(context_parts)

    except Exception as e:
        print(f"RAG query error: {e}")
        return ""
