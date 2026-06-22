from datetime import datetime
from pydantic import BaseModel


class TenantCreate(BaseModel):
    name: str


class TenantOut(BaseModel):
    id: str
    name: str
    api_key: str
    plan: str
    message_limit: int
    source: str = "standalone"
    status: str = "active"
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    title: str
    content: str


class DocumentOut(BaseModel):
    id: str
    title: str
    source: str
    status: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class SourceOut(BaseModel):
    document_id: str
    title: str
    snippet: str
    score: float


class UsageOut(BaseModel):
    plan: str
    message_limit: int
    messages_used: int
    messages_remaining: int
