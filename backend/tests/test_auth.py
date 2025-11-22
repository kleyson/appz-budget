"""Tests for authentication"""

import pytest

from models import User
from repositories import UserRepository
from utils.auth import get_password_hash


@pytest.fixture
def sample_user(test_db):
    """Create a sample user"""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_admin=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


class TestAuthController:
    """Tests for authentication endpoints"""

    def test_register_user_success(self, client, test_db, api_headers):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User",
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "hashed_password" not in data

        # Verify user was created in database
        user_repo = UserRepository(test_db)
        user = user_repo.get_by_email("newuser@example.com")
        assert user is not None
        assert user.email == "newuser@example.com"

    def test_register_user_duplicate_email(self, client, sample_user, api_headers):
        """Test registration with duplicate email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "anotherpassword123",
                "full_name": "Another User",
            },
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_register_user_missing_fields(self, client, api_headers):
        """Test registration with missing required fields"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                # Missing password
            },
            headers=api_headers,
        )
        assert response.status_code == 422  # Validation error

    def test_register_user_no_api_key(self, client):
        """Test registration without API key"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User",
            },
        )
        assert response.status_code == 403
        assert "missing api key" in response.json()["detail"].lower()

    def test_login_no_api_key(self, client):
        """Test login without API key"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
        )
        assert response.status_code == 403
        assert "missing api key" in response.json()["detail"].lower()

    def test_login_invalid_api_key(self, client):
        """Test login with invalid API key"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers={"X-API-Key": "invalid-api-key"},
        )
        assert response.status_code == 403
        assert "invalid api key" in response.json()["detail"].lower()

    def test_forgot_password_no_api_key(self, client):
        """Test forgot password without API key"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "email": "test@example.com",
            },
        )
        assert response.status_code == 403
        assert "missing api key" in response.json()["detail"].lower()

    def test_reset_password_no_api_key(self, client):
        """Test reset password without API key"""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "some-token",
                "new_password": "newpassword123",
            },
        )
        assert response.status_code == 403
        assert "missing api key" in response.json()["detail"].lower()

    def test_login_success(self, client, sample_user, api_headers):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == sample_user.id
        assert data["email"] == sample_user.email

    def test_login_invalid_email(self, client, api_headers):
        """Test login with invalid email"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "somepassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_invalid_password(self, client, sample_user, api_headers):
        """Test login with invalid password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
            },
            headers=api_headers,
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_inactive_user(self, client, test_db, sample_user, api_headers):
        """Test login with inactive user"""
        # Deactivate user
        sample_user.is_active = False
        test_db.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()

    def test_forgot_password_success(self, client, sample_user, api_headers):
        """Test successful password reset request"""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "email": "test@example.com",
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # In development, token is returned
        assert "token" in data

    def test_forgot_password_nonexistent_user(self, client, api_headers):
        """Test password reset request for nonexistent user"""
        # Should still return success for security
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={
                "email": "nonexistent@example.com",
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        assert "message" in response.json()

    def test_reset_password_success(self, client, test_db, sample_user, api_headers):
        """Test successful password reset"""
        # Create a reset token
        from repositories import UserRepository
        from services import UserService

        user_repo = UserRepository(test_db)
        service = UserService(user_repo)
        result = service.request_password_reset("test@example.com")
        token = result["token"]

        # Reset password
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token,
                "new_password": "newsecurepassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()

        # Verify new password works
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "newsecurepassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200

    def test_reset_password_invalid_token(self, client, api_headers):
        """Test password reset with invalid token"""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "invalid-token-12345",
                "new_password": "newpassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 400
        assert (
            "invalid" in response.json()["detail"].lower()
            or "expired" in response.json()["detail"].lower()
        )

    def test_get_current_user(self, client, sample_user, api_headers):
        """Test getting current authenticated user"""
        # First login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user.email
        assert data["id"] == sample_user.id
        assert "is_admin" in data
        assert data["is_admin"] == sample_user.is_admin

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without token"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    def test_change_password_success(self, client, sample_user, api_headers):
        """Test successful password change"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Change password
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpassword123",
                "new_password": "newsecurepassword456",
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        assert "successfully" in response.json()["message"].lower()

        # Verify new password works
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "newsecurepassword456",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200

        # Verify old password doesn't work
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 401

    def test_change_password_wrong_current_password(self, client, sample_user, api_headers):
        """Test password change with wrong current password"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to change password with wrong current password
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newsecurepassword456",
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()

    def test_change_password_unauthorized(self, client):
        """Test password change without authentication"""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "oldpassword",
                "new_password": "newpassword",
            },
        )
        assert response.status_code == 401

    def test_change_password_missing_fields(self, client, sample_user, api_headers):
        """Test password change with missing fields"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Missing new_password
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpassword123",
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 422  # Validation error


class TestUserManagement:
    """Tests for user management endpoints (admin only)"""

    def get_auth_token(
        self, client, api_headers, email="test@example.com", password="testpassword123"
    ):
        """Helper to get authentication token"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
            headers=api_headers,
        )
        assert response.status_code == 200
        return response.json()["access_token"]

    def test_list_users(self, client, sample_user, api_headers):
        """Test listing all users"""
        token = self.get_auth_token(client, api_headers)
        response = client.get(
            "/api/v1/auth/users",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(user["email"] == "test@example.com" for user in data)
        # Verify all users have is_admin field
        for user in data:
            assert "is_admin" in user

    def test_list_users_unauthorized(self, client):
        """Test listing users without authentication"""
        response = client.get("/api/v1/auth/users")
        assert response.status_code == 401

    def test_list_users_non_admin(self, client, test_db, api_headers):
        """Test that non-admin users cannot list users"""
        # Create a non-admin user
        from repositories import UserRepository
        from utils.auth import get_password_hash

        user_repo = UserRepository(test_db)
        user_repo.create(
            {
                "email": "regular@example.com",
                "hashed_password": get_password_hash("password123"),
                "full_name": "Regular User",
                "is_admin": False,
            }
        )

        # Login as non-admin user
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": "regular@example.com", "password": "password123"},
            headers=api_headers,
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Try to list users
        response = client.get(
            "/api/v1/auth/users",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 403
        assert "admin" in response.json()["detail"].lower()

    def test_create_user_admin(self, client, sample_user, api_headers):
        """Test creating a user as admin"""
        token = self.get_auth_token(client, api_headers)
        response = client.post(
            "/api/v1/auth/users",
            json={
                "email": "newadmin@example.com",
                "password": "securepassword123",
                "full_name": "New Admin User",
                "is_active": True,
                "is_admin": True,
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newadmin@example.com"
        assert data["full_name"] == "New Admin User"
        assert data["is_active"] is True
        assert data["is_admin"] is True
        assert "id" in data

    def test_create_user_admin_duplicate_email(self, client, sample_user, api_headers):
        """Test creating user with duplicate email"""
        token = self.get_auth_token(client, api_headers)
        response = client.post(
            "/api/v1/auth/users",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Duplicate",
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_get_user_by_id(self, client, sample_user, api_headers):
        """Test getting a specific user by ID"""
        token = self.get_auth_token(client, api_headers)
        response = client.get(
            f"/api/v1/auth/users/{sample_user.id}",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_user.id
        assert data["email"] == sample_user.email
        assert "is_admin" in data

    def test_get_user_by_id_not_found(self, client, sample_user, api_headers):
        """Test getting a non-existent user"""
        token = self.get_auth_token(client, api_headers)
        response = client.get(
            "/api/v1/auth/users/99999",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 404

    def test_update_user(self, client, test_db, sample_user, api_headers):
        """Test updating a user"""
        token = self.get_auth_token(client, api_headers)
        response = client.put(
            f"/api/v1/auth/users/{sample_user.id}",
            json={
                "email": "updated@example.com",
                "full_name": "Updated Name",
                "is_active": False,
            },
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "updated@example.com"
        assert data["full_name"] == "Updated Name"
        assert data["is_active"] is False
        assert "is_admin" in data

    def test_update_user_partial(self, client, sample_user, api_headers):
        """Test updating a user with partial data"""
        token = self.get_auth_token(client, api_headers)
        response = client.put(
            f"/api/v1/auth/users/{sample_user.id}",
            json={"full_name": "Only Name Updated"},
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Only Name Updated"
        # Email should remain unchanged
        assert data["email"] == sample_user.email

    def test_update_user_duplicate_email(self, client, test_db, sample_user, api_headers):
        """Test updating user with duplicate email"""
        # Create another user
        from repositories import UserRepository
        from utils.auth import get_password_hash

        user_repo = UserRepository(test_db)
        user_repo.create(
            {
                "email": "other@example.com",
                "hashed_password": get_password_hash("password123"),
                "full_name": "Other User",
                "is_admin": False,
            }
        )

        token = self.get_auth_token(client, api_headers)
        response = client.put(
            f"/api/v1/auth/users/{sample_user.id}",
            json={"email": "other@example.com"},
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_delete_user(self, client, test_db, sample_user, api_headers):
        """Test deleting a user"""
        # Create another user to delete
        from repositories import UserRepository
        from utils.auth import get_password_hash

        user_repo = UserRepository(test_db)
        user_to_delete = user_repo.create(
            {
                "email": "todelete@example.com",
                "hashed_password": get_password_hash("password123"),
                "full_name": "To Delete",
            }
        )

        token = self.get_auth_token(client, api_headers)
        response = client.delete(
            f"/api/v1/auth/users/{user_to_delete.id}",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"].lower()

        # Verify user was deleted
        deleted_user = user_repo.get_by_id(user_to_delete.id)
        assert deleted_user is None

    def test_delete_user_self(self, client, sample_user, api_headers):
        """Test that user cannot delete themselves"""
        token = self.get_auth_token(client, api_headers)
        response = client.delete(
            f"/api/v1/auth/users/{sample_user.id}",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 400
        assert "cannot delete your own account" in response.json()["detail"].lower()

    def test_delete_user_not_found(self, client, sample_user, api_headers):
        """Test deleting a non-existent user"""
        token = self.get_auth_token(client, api_headers)
        response = client.delete(
            "/api/v1/auth/users/99999",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 404
