from datetime import datetime
from pydantic import BaseModel


class TenantCreate(BaseModel):
    name: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TenantOut(BaseModel):
    id: str
    name: str
    email: str | None = None
    api_key: str
    widget_key: str | None = None
    allowed_domains: str | None = None
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
