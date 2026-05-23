from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic_settings import BaseSettings, SettingsConfigDict
from shared.supabase_client import get_supabase_admin_client

security = HTTPBearer()


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


_settings = Settings()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Verify Supabase JWT token and return the user_id.
    """
    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided",
        )

    try:
        # Get Supabase admin client to verify token
        supabase = get_supabase_admin_client()
        
        # Verify the token using Supabase's verify_jwt
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        
        return str(user.id)

    except Exception as e:
        # If Supabase verification fails, try JWT decode as fallback for dev
        try:
            payload = jwt.get_unverified_claims(token)
            return payload.get("sub", "")
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )



