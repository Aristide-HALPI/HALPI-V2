from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.config import settings
from app.api.services.supabase import supabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


class TokenPayload(BaseModel):
    sub: Optional[str] = None


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate token and return current user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except JWTError:
        raise credentials_exception
    
    # Verify user exists in Supabase
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception


async def get_current_active_user(current_user = Depends(get_current_user)):
    """
    Check if current user is active
    """
    if not current_user.aud == "authenticated":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
