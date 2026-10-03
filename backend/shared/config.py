from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    chroma_db_path: str = "./chroma_db"
    rapidapi_key: Optional[str] = None
    rapidapi_host: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
