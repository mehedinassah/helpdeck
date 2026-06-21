"""LLM access via any OpenAI-compatible endpoint (Groq by default).

Switch providers with env vars only (LLM_BASE_URL / LLM_MODEL / LLM_API_KEY).
"""
from collections.abc import Iterator

from openai import OpenAI

from ..config import settings

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url)
    return _client


SYSTEM_PROMPT = (
    "You are Helpdeck, a helpful customer-support assistant for a specific business. "
    "Answer the user's question using ONLY the context provided below. "
    "If the answer is not contained in the context, say you don't have that information "
    "and suggest contacting a human. Be concise, friendly, and accurate. "
    "Never invent facts, prices, or policies."
)


def build_messages(question: str, context: str, history: list[dict] | None = None) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    user_content = (
        f"Context from the knowledge base:\n\"\"\"\n{context}\n\"\"\"\n\n"
        f"Customer question: {question}"
    )
    messages.append({"role": "user", "content": user_content})
    return messages


def stream_chat(messages: list[dict]) -> Iterator[str]:
    """Yield response text deltas from the LLM."""
    stream = _get_client().chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.2,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
