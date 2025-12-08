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
        assert "email_sent" in data
        # email_sent should be False when SMTP is not configured
        assert data["email_sent"] is False

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
        service.request_password_reset("test@example.com")

        # Get the token from database
        reset_tokens = user_repo.get_active_reset_tokens()
        assert len(reset_tokens) > 0
        token = reset_tokens[0].token

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


class TestPasswordResetWithShortCodes:
    """Tests for password reset with short codes"""

    def test_short_code_generation(self):
        """Test that short codes are generated correctly"""
        from utils.auth import generate_short_code

        # Test default length (6 digits)
        code = generate_short_code()
        assert len(code) == 6
        assert code.isdigit()

        # Test custom length
        code_8 = generate_short_code(8)
        assert len(code_8) == 8
        assert code_8.isdigit()

        # Test uniqueness - generate multiple codes
        codes = {generate_short_code() for _ in range(100)}
        # Should have high uniqueness (at least 90% unique)
        assert len(codes) >= 90

    def test_forgot_password_creates_short_code(self, client, test_db, sample_user, api_headers):
        """Test that forgot password creates a short code"""
        from repositories import UserRepository

        user_repo = UserRepository(test_db)

        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test@example.com"},
            headers=api_headers,
        )
        assert response.status_code == 200

        # Check that reset token was created with short code
        reset_tokens = user_repo.get_active_reset_tokens()
        assert len(reset_tokens) > 0
        assert reset_tokens[0].short_code is not None
        assert len(reset_tokens[0].short_code) == 6
        assert reset_tokens[0].short_code.isdigit()

    def test_reset_password_with_short_code(self, client, test_db, sample_user, api_headers):
        """Test resetting password with 6-digit short code"""
        from repositories import UserRepository
        from services import UserService

        user_repo = UserRepository(test_db)
        service = UserService(user_repo)
        service.request_password_reset("test@example.com")

        # Get the short code from database
        reset_tokens = user_repo.get_active_reset_tokens()
        assert len(reset_tokens) > 0
        short_code = reset_tokens[0].short_code

        # Reset password using short code
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": short_code,
                "new_password": "newpasswordwithcode123",
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
                "password": "newpasswordwithcode123",
            },
            headers=api_headers,
        )
        assert login_response.status_code == 200

    def test_reset_password_with_long_token(self, client, test_db, sample_user, api_headers):
        """Test that long tokens still work (backward compatibility)"""
        from repositories import UserRepository
        from services import UserService

        user_repo = UserRepository(test_db)
        service = UserService(user_repo)
        service.request_password_reset("test@example.com")

        # Get the long token from database
        reset_tokens = user_repo.get_active_reset_tokens()
        assert len(reset_tokens) > 0
        long_token = reset_tokens[0].token

        # Reset password using long token
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": long_token,
                "new_password": "newpasswordwithlongtoken123",
            },
            headers=api_headers,
        )
        assert response.status_code == 200

    def test_reset_password_invalid_short_code(self, client, api_headers):
        """Test reset with invalid short code"""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "999999",  # Non-existent short code
                "new_password": "newpassword123",
            },
            headers=api_headers,
        )
        assert response.status_code == 400
        assert (
            "invalid" in response.json()["detail"].lower()
            or "expired" in response.json()["detail"].lower()
        )

    def test_reset_password_used_short_code(self, client, test_db, sample_user, api_headers):
        """Test that short code cannot be reused"""
        from repositories import UserRepository
        from services import UserService

        user_repo = UserRepository(test_db)
        service = UserService(user_repo)
        service.request_password_reset("test@example.com")

        # Get the short code
        reset_tokens = user_repo.get_active_reset_tokens()
        short_code = reset_tokens[0].short_code

        # Use the code once
        response1 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": short_code, "new_password": "newpassword123"},
            headers=api_headers,
        )
        assert response1.status_code == 200

        # Try to use the same code again
        # Note: Repository filters out used tokens, so error is "invalid or expired"
        response2 = client.post(
            "/api/v1/auth/reset-password",
            json={"token": short_code, "new_password": "anotherpassword123"},
            headers=api_headers,
        )
        assert response2.status_code == 400
        assert (
            "invalid" in response2.json()["detail"].lower()
            or "expired" in response2.json()["detail"].lower()
        )

    def test_reset_password_expired_short_code(self, client, test_db, sample_user, api_headers):
        """Test that expired short codes are rejected"""
        from repositories import UserRepository
        from utils.auth import generate_reset_token, generate_short_code

        user_repo = UserRepository(test_db)

        # Create an expired reset token manually
        expired_token = generate_reset_token()
        expired_code = generate_short_code()
        user_repo.create_reset_token(
            sample_user.id,
            expired_token,
            short_code=expired_code,
            expires_in_minutes=-10,  # Already expired
        )

        # Try to use the expired code
        response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": expired_code, "new_password": "newpassword123"},
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()


class TestPasswordResetAdminEndpoints:
    """Tests for admin password reset management endpoints"""

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

    def test_list_password_resets(self, client, test_db, sample_user, api_headers):
        """Test admin can list active password resets"""
        from repositories import UserRepository
        from services import UserService

        # Create a password reset request
        user_repo = UserRepository(test_db)
        service = UserService(user_repo)
        service.request_password_reset("test@example.com")

        token = self.get_auth_token(client, api_headers)
        response = client.get(
            "/api/v1/auth/password-resets",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["user_email"] == "test@example.com"
        assert "short_code" in data[0]
        assert data[0]["short_code"] is not None
        assert len(data[0]["short_code"]) == 6
        assert "created_at" in data[0]
        assert "expires_at" in data[0]
        assert "minutes_remaining" in data[0]

    def test_list_password_resets_non_admin(self, client, test_db, api_headers):
        """Test non-admin cannot list password resets"""
        from repositories import UserRepository
        from utils.auth import get_password_hash

        # Create a non-admin user
        user_repo = UserRepository(test_db)
        user_repo.create(
            {
                "email": "regular@example.com",
                "hashed_password": get_password_hash("password123"),
                "full_name": "Regular User",
                "is_admin": False,
            }
        )

        # Login as non-admin
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": "regular@example.com", "password": "password123"},
            headers=api_headers,
        )
        token = login_response.json()["access_token"]

        # Try to list password resets
        response = client.get(
            "/api/v1/auth/password-resets",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 403

    def test_generate_reset_link_for_user(self, client, test_db, sample_user, api_headers):
        """Test admin can generate reset link for any user"""
        token = self.get_auth_token(client, api_headers)
        response = client.post(
            f"/api/v1/auth/users/{sample_user.id}/generate-reset-link",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_email"] == "test@example.com"
        assert "reset_url" in data
        assert "short_code" in data
        assert len(data["short_code"]) == 6
        assert data["short_code"].isdigit()
        assert "expires_in_minutes" in data
        assert data["expires_in_minutes"] == 30

        # Verify the generated code works
        short_code = data["short_code"]
        reset_response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": short_code, "new_password": "admingeneratedpassword123"},
            headers=api_headers,
        )
        assert reset_response.status_code == 200

    def test_generate_reset_link_non_admin(self, client, test_db, api_headers):
        """Test non-admin cannot generate reset links"""
        from repositories import UserRepository
        from utils.auth import get_password_hash

        # Create a non-admin user
        user_repo = UserRepository(test_db)
        non_admin = user_repo.create(
            {
                "email": "regular@example.com",
                "hashed_password": get_password_hash("password123"),
                "full_name": "Regular User",
                "is_admin": False,
            }
        )

        # Login as non-admin
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": "regular@example.com", "password": "password123"},
            headers=api_headers,
        )
        token = login_response.json()["access_token"]

        # Try to generate reset link
        response = client.post(
            f"/api/v1/auth/users/{non_admin.id}/generate-reset-link",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 403

    def test_generate_reset_link_nonexistent_user(self, client, sample_user, api_headers):
        """Test generating reset link for non-existent user"""
        token = self.get_auth_token(client, api_headers)
        response = client.post(
            "/api/v1/auth/users/99999/generate-reset-link",
            headers={"Authorization": f"Bearer {token}", **api_headers},
        )
        assert response.status_code == 404


class TestPasswordResetRepository:
    """Tests for password reset repository methods"""

    def test_get_reset_token_by_short_code(self, test_db, sample_user):
        """Test getting reset token by short code"""
        from repositories import UserRepository
        from utils.auth import generate_reset_token, generate_short_code

        user_repo = UserRepository(test_db)
        token = generate_reset_token()
        short_code = generate_short_code()

        # Create reset token
        reset_token = user_repo.create_reset_token(
            sample_user.id, token, short_code=short_code, expires_in_minutes=30
        )

        # Retrieve by short code
        found_token = user_repo.get_reset_token_by_short_code(short_code)
        assert found_token is not None
        assert found_token.id == reset_token.id
        assert found_token.short_code == short_code

    def test_get_active_reset_tokens(self, test_db, sample_user):
        """Test getting all active reset tokens"""
        from repositories import UserRepository
        from utils.auth import generate_reset_token, generate_short_code

        user_repo = UserRepository(test_db)

        # Create multiple reset tokens
        for _ in range(3):
            token = generate_reset_token()
            short_code = generate_short_code()
            user_repo.create_reset_token(
                sample_user.id, token, short_code=short_code, expires_in_minutes=30
            )

        # Create an expired token
        expired_token = generate_reset_token()
        expired_code = generate_short_code()
        user_repo.create_reset_token(
            sample_user.id, expired_token, short_code=expired_code, expires_in_minutes=-10
        )

        # Get active tokens
        active_tokens = user_repo.get_active_reset_tokens()
        assert len(active_tokens) == 3  # Should not include expired token

    def test_create_reset_token_with_minutes_expiration(self, test_db, sample_user):
        """Test creating reset token with minute-based expiration"""
        from datetime import datetime, timedelta

        from repositories import UserRepository
        from utils.auth import generate_reset_token, generate_short_code

        user_repo = UserRepository(test_db)
        token = generate_reset_token()
        short_code = generate_short_code()

        # Create with 30 minute expiration
        reset_token = user_repo.create_reset_token(
            sample_user.id, token, short_code=short_code, expires_in_minutes=30
        )

        # Check expiration is approximately 30 minutes from now
        expected_expiration = datetime.utcnow() + timedelta(minutes=30)
        time_diff = abs((reset_token.expires_at - expected_expiration).total_seconds())
        assert time_diff < 5  # Within 5 seconds
