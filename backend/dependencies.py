"""Shared dependencies"""

import os

from fastapi import Depends, Header, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import SessionLocal
from repositories import UserRepository
from utils.auth import decode_access_token

# API Key configuration
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# JWT Bearer token
security = HTTPBearer(auto_error=False)


def get_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Validate API key from header"""
    expected_api_key = os.getenv("API_KEY")

    if not expected_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API key not configured on server",
        )

    if not api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing API key")

    if api_key != expected_api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key")

    return api_key


def get_client_info(x_client_info: str | None = Header(None, alias="X-Client-Info")) -> str | None:
    """Extract client info (platform/version) from header (optional)

    Expected format: Platform/Version (e.g., "Web/2.0", "Android/1.3", "iOS/1.5")
    """
    return x_client_info


def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> int:
    """Get current authenticated user ID from JWT token"""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials"
        )

    user_id: int | None = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    # Verify user exists and is active
    user_repository = UserRepository(db)
    user = user_repository.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive"
        )

    return user_id


def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get current authenticated user object"""
    user_repository = UserRepository(db)
    user = user_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_current_admin_user(
    current_user=Depends(get_current_user),
):
    """Get current authenticated user and verify they are an admin"""
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def get_current_user_name(
    current_user=Depends(get_current_user),
) -> str | None:
    """Get current user's name for audit fields"""
    return current_user.full_name or current_user.email
