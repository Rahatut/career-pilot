from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from shared.auth import get_current_user
from shared.db import get_db
from shared.models import User
from shared.schemas import SignUpRequest, SignInRequest, AuthResponse
from shared.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(
    request: SignUpRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Create a new user account using Supabase Auth.
    """
    supabase = get_supabase_admin_client()
    
    # Create user in Supabase Auth using admin API with correct signature
    try:
        # Try admin create_user with AdminUserCreateRequest-like object
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
        })
        user_id = str(auth_response.user.id)
    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG: Create user failed: {error_msg}")
        # If admin create fails, try the fallback approach
        try:
            # Create user without password first via admin API
            # Then manually verify or set password
            admin_user = supabase.auth.admin.create_user(
                {
                    "email": request.email,
                    "email_confirm": True,
                }
            )
            user_id = str(admin_user.user.id)
            
            # Now update the password
            supabase.auth.admin.update_user_by_id(
                user_id,
                {"password": request.password},
            )
        except Exception as e2:
            error_msg = str(e2)
            print(f"DEBUG: Fallback failed: {error_msg}")
            if "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many signup attempts. Please try again later.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create user: {error_msg}",
            )

    # Create user profile in database
    try:
        db_user = User(
            id=uuid.UUID(user_id),
            email=request.email,
            name=request.name,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        # Clean up Supabase user if DB fails
        try:
            supabase.auth.admin.delete_user(user_id)
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user profile: {str(e)}",
        )

    # Get session token by signing in with the credentials
    try:
        sign_in_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        token = sign_in_response.session.access_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to create session: {str(e)}",
        )

    return AuthResponse(
        user_id=str(db_user.id),
        name=db_user.name or "",
        email=db_user.email,
        token=token,
    )


@router.post("/signin", response_model=AuthResponse)
def signin(
    request: SignInRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Sign in a user using Supabase Auth.
    """
    supabase = get_supabase_admin_client()
    
    # Authenticate with Supabase
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        user_id = str(auth_response.user.id)
        token = auth_response.session.access_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Get user profile from database
    user = db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    ).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return AuthResponse(
        user_id=str(user.id),
        name=user.name or "",
        email=user.email,
        token=token,
    )


@router.get("/me")
def get_current_user_profile(
    current_user_id: Annotated[str, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Get current logged-in user's profile.
    """
    user = db.execute(
        select(User).where(User.id == uuid.UUID(current_user_id))
    ).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return AuthResponse(
        user_id=str(user.id),
        name=user.name or "",
        email=user.email,
        token="",  # Don't return token in this endpoint
    )
