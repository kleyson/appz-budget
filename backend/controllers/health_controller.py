"""Health check controller"""

from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/health", tags=["health"])


def get_version() -> str:
    """Read version from VERSION file"""
    version_file = Path(__file__).parent.parent.parent / "VERSION"
    try:
        if version_file.exists():
            version = version_file.read_text().strip()
            return version if version else "1.0.0"
        return "1.0.0"
    except Exception:
        return "1.0.0"


class HealthResponse(BaseModel):
    status: str
    message: str
    version: str


@router.get("", response_model=HealthResponse)
def health_check():
    """Health check endpoint - no authentication required"""
    return HealthResponse(
        status="ok",
        message="API is running",
        version=get_version(),
    )
