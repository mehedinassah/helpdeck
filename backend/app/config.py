from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg2://helpdeck:helpdeck@localhost:5432/helpdeck"

    # LLM (OpenAI-compatible: Groq by default)
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"

    # Platform integration: trusted partners (e.g. Perico) provision tenants
    # server-to-server using this key via the X-Platform-Key header.
    platform_api_key: str = ""

    # Embeddings (local via fastembed)
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384

    # RAG params
    chunk_size: int = 1000
    chunk_overlap: int = 150
    retrieval_top_k: int = 5

    # Stripe billing (standalone global USD plans). Test-mode keys are fine.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro: str = ""        # Stripe Price ID for the Pro plan
    stripe_price_business: str = ""   # Stripe Price ID for the Business plan
    # Where Stripe redirects after checkout (the standalone dashboard).
    billing_success_url: str = "http://localhost:5173/?checkout=success"
    billing_cancel_url: str = "http://localhost:5173/?checkout=cancelled"

    # CORS (comma-separated, or "*")
    cors_origins: str = "*"

    # Abuse protection for the public chat endpoint
    chat_rate_per_tenant_per_min: int = 60
    chat_rate_per_ip_per_min: int = 30
    max_message_chars: int = 2000

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
