
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: str | None = None
    openai_api_key: str | None = None
    chroma_db_path: str = "./chroma_db"
    rapidapi_key: str | None = None
    rapidapi_host: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
