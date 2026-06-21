from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg2://helpdeck:helpdeck@localhost:5432/helpdeck"

    # LLM (OpenAI-compatible: Groq by default)
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"

    # Embeddings (local via fastembed)
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384

    # RAG params
    chunk_size: int = 1000
    chunk_overlap: int = 150
    retrieval_top_k: int = 5

    # CORS (comma-separated, or "*")
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
