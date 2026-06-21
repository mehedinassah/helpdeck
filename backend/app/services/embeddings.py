"""Local, free embeddings via fastembed (ONNX). No API key required.

Groq and DeepSeek do not provide an embeddings endpoint, so retrieval runs
on a small local model. bge-small-en-v1.5 -> 384-dim vectors.
"""
from functools import lru_cache

from fastembed import TextEmbedding

from ..config import settings


@lru_cache(maxsize=1)
def _model() -> TextEmbedding:
    # Model is downloaded once and cached locally on first use.
    return TextEmbedding(model_name=settings.embedding_model)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of documents/chunks."""
    return [vec.tolist() for vec in _model().embed(texts)]


def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    return next(_model().query_embed(text)).tolist()
