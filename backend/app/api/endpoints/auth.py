from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.models.pydantic_models import Token, UserCreate
from app.api.services.supabase import supabase
from app.core.security import create_access_token

router = APIRouter()


@router.post("/auth/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create our own JWT token
        access_token = create_access_token(subject=auth_response.user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/auth/register", response_model=Dict[str, Any])
async def register_user(
    user_in: UserCreate,
) -> Any:
    """
    Register a new user
    """
    try:
        # Register with Supabase
        auth_response = supabase.auth.sign_up({
            "email": user_in.email,
            "password": user_in.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )
        
        # Create user profile
        profile_data = {
            "id": auth_response.user.id,
            "first_name": user_in.first_name,
            "last_name": user_in.last_name,
            "daily_time_goal": 60,  # Default values
            "weekly_time_goal": 300,
            "availability": {}
        }
        
        profile_response = supabase.table("user_profiles").insert(profile_data).execute()
        
        if not profile_response.data:
            # If profile creation fails, we should ideally delete the auth user
            # but Supabase Python client doesn't expose this functionality directly
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User created but profile creation failed",
            )
        
        # Create access token
        access_token = create_access_token(subject=auth_response.user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": user_in.email,
                "first_name": user_in.first_name,
                "last_name": user_in.last_name,
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration error: {str(e)}",
        )
