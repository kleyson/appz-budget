"""Backup controller for database backups with signed URLs"""

import hashlib
import hmac
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import FileResponse

from dependencies import get_api_key, get_current_user

router = APIRouter(prefix="/api/v1/backups", tags=["backups"])

# Backup directory path
BACKUP_DIR = Path("/app/backend/data/backups")
# Fallback for local development
if not BACKUP_DIR.exists():
    BACKUP_DIR = Path(__file__).parent.parent / "data" / "backups"


# Secret key for signing URLs (uses API_KEY as the base)
def get_signing_secret() -> str:
    """Get the secret key for signing download URLs"""
    api_key = os.getenv("API_KEY", "default-dev-key")
    # Derive a signing secret from the API key
    return hashlib.sha256(f"backup-signing-{api_key}".encode()).hexdigest()


def generate_signature(filename: str, expires: int) -> str:
    """Generate HMAC signature for a download URL"""
    secret = get_signing_secret()
    message = f"{filename}:{expires}"
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def verify_signature(filename: str, expires: int, signature: str) -> bool:
    """Verify HMAC signature for a download URL"""
    expected = generate_signature(filename, expires)
    return hmac.compare_digest(expected, signature)


@router.get("")
def list_backups(
    api_key: str = Security(get_api_key),
    current_user=Depends(get_current_user),
):
    """List available database backups (admin only)"""
    # Only admin users can access backups
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    backups = []

    if BACKUP_DIR.exists():
        for file in sorted(BACKUP_DIR.glob("*.gz"), reverse=True):
            stat = file.stat()
            backups.append(
                {
                    "filename": file.name,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                }
            )

    return {"backups": backups, "backup_dir": str(BACKUP_DIR)}


@router.post("/create")
def create_backup(
    api_key: str = Security(get_api_key),
    current_user=Depends(get_current_user),
):
    """Create a new backup manually (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # Database path
    db_path = Path("/app/backend/data/budget.db")
    if not db_path.exists():
        # Fallback for local development
        db_path = Path(__file__).parent.parent / "data" / "budget.db"

    if not db_path.exists():
        raise HTTPException(status_code=404, detail="Database not found")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"budget_backup_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename

    try:
        # Use sqlite3 backup command for consistency
        result = subprocess.run(
            ["sqlite3", str(db_path), f".backup '{backup_path}'"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Backup failed: {result.stderr}")

        # Compress the backup
        subprocess.run(["gzip", str(backup_path)], check=True, timeout=60)

        compressed_path = Path(f"{backup_path}.gz")
        stat = compressed_path.stat()

        return {
            "message": "Backup created successfully",
            "filename": compressed_path.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Backup operation timed out") from None
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}") from e


@router.get("/{filename}/download-url")
def get_download_url(
    filename: str,
    api_key: str = Security(get_api_key),
    current_user=Depends(get_current_user),
):
    """Generate a signed download URL for a backup file (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Validate filename (prevent path traversal)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    backup_path = BACKUP_DIR / filename
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup file not found")

    # Generate signed URL valid for 5 minutes
    expires = int(time.time()) + 300  # 5 minutes
    signature = generate_signature(filename, expires)

    return {
        "download_url": f"/api/v1/backups/{filename}/download?expires={expires}&signature={signature}",
        "expires_at": datetime.fromtimestamp(expires).isoformat(),
        "valid_for_seconds": 300,
    }


@router.get("/{filename}/download")
def download_backup(
    filename: str,
    expires: int = Query(..., description="Expiration timestamp"),
    signature: str = Query(..., description="HMAC signature"),
):
    """Download a backup file using a signed URL"""
    # Validate filename (prevent path traversal)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Verify signature
    if not verify_signature(filename, expires, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Check expiration
    if time.time() > expires:
        raise HTTPException(status_code=403, detail="Download link has expired")

    backup_path = BACKUP_DIR / filename
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup file not found")

    return FileResponse(
        path=backup_path,
        filename=filename,
        media_type="application/gzip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{filename}")
def delete_backup(
    filename: str,
    api_key: str = Security(get_api_key),
    current_user=Depends(get_current_user),
):
    """Delete a backup file (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Validate filename (prevent path traversal)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    backup_path = BACKUP_DIR / filename
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup file not found")

    backup_path.unlink()
    return {"message": f"Backup {filename} deleted successfully"}
