from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import Client, create_client


class SupabaseSettings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


_settings = SupabaseSettings()


def get_supabase_client() -> Client:
    """Get Supabase client for direct database access."""
    return create_client(_settings.supabase_url, _settings.supabase_key)


def get_supabase_admin_client() -> Client:
    """Get Supabase admin client (service role) for admin operations."""
    return create_client(_settings.supabase_url, _settings.supabase_service_role_key)
