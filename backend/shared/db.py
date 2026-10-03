from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import settings
from .models import Base

# Fix Supabase connection string: remove pgbouncer option that psycopg2 doesn't support
def get_clean_database_url(db_url: str) -> str:
    """Remove pgbouncer parameter from Supabase URLs."""
    # Simple approach: replace ?pgbouncer=true with empty string
    clean_url = db_url.replace("?pgbouncer=true", "")
    clean_url = clean_url.replace("&pgbouncer=true", "")
    return clean_url

clean_url = get_clean_database_url(settings.database_url)
print(f"DEBUG: Original URL: {settings.database_url[:50]}...")
print(f"DEBUG: Clean URL: {clean_url[:50]}...")
engine = create_engine(clean_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
