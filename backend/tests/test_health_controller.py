"""Tests for health check endpoint"""

from pathlib import Path


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


class TestHealthController:
    """Tests for health check endpoint"""

    def test_health_check_success(self, client):
        """Test health check endpoint returns success"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["message"] == "API is running"
        assert data["version"] == get_version()

    def test_health_check_no_auth_required(self, client):
        """Test health check endpoint doesn't require authentication"""
        # Should work without API key
        response = client.get("/api/v1/health")
        assert response.status_code == 200
