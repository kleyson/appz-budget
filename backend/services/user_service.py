"""User service for business logic"""

from datetime import datetime

from exceptions import NotFoundError, ValidationError
from repositories import UserRepository
from utils.auth import generate_reset_token, get_password_hash, verify_password


class UserService:
    """Service for user business logic"""

    def __init__(self, user_repository: UserRepository):
        self.repository = user_repository

    def create_user(
        self,
        email: str,
        password: str,
        full_name: str | None = None,
        user_name: str | None = None,
        is_active: bool = True,
        is_admin: bool = False,
    ):
        """Create a new user"""
        # Check if user already exists
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            raise ValidationError("User with this email already exists")

        # Hash password
        hashed_password = get_password_hash(password)

        # Create user
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "is_active": is_active,
            "is_admin": is_admin,
        }
        return self.repository.create(user_data, user_name)

    def authenticate_user(self, email: str, password: str):
        """Authenticate a user and return the user if valid"""
        user = self.repository.get_by_email(email)
        if not user:
            raise ValidationError("Invalid email or password")

        if not user.is_active:
            raise ValidationError("User account is inactive")

        if not verify_password(password, user.hashed_password):
            raise ValidationError("Invalid email or password")

        return user

    def get_user_by_id(self, user_id: int):
        """Get user by ID"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def get_user_by_email(self, email: str):
        """Get user by email"""
        user = self.repository.get_by_email(email)
        if not user:
            raise NotFoundError("User not found")
        return user

    def request_password_reset(self, email: str):
        """Request a password reset token"""
        user = self.repository.get_by_email(email)
        if not user:
            # Don't reveal if user exists or not for security
            return {"message": "If the email exists, a password reset link has been sent"}

        # Generate reset token
        token = generate_reset_token()

        # Create reset token record
        self.repository.create_reset_token(user.id, token)

        # In a real application, you would send an email here with the token
        # For now, we'll return the token in the response (not recommended for production)
        return {"message": "Password reset token generated", "token": token}

    def reset_password(self, token: str, new_password: str):
        """Reset password using a reset token"""
        reset_token = self.repository.get_reset_token(token)
        if not reset_token:
            raise ValidationError("Invalid or expired reset token")

        if reset_token.expires_at < datetime.utcnow():
            raise ValidationError("Reset token has expired")

        if reset_token.used:
            raise ValidationError("Reset token has already been used")

        # Get user
        user = self.repository.get_by_id(reset_token.user_id)
        if not user:
            raise NotFoundError("User not found")

        # Update password
        hashed_password = get_password_hash(new_password)
        self.repository.update(
            user, {"hashed_password": hashed_password}, user.full_name or user.email
        )

        # Mark token as used
        self.repository.mark_reset_token_used(reset_token)

        return {"message": "Password reset successfully"}

    def change_password(self, user_id: int, current_password: str, new_password: str):
        """Change password for authenticated user"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            raise ValidationError("Current password is incorrect")

        # Update password
        hashed_password = get_password_hash(new_password)
        self.repository.update(
            user, {"hashed_password": hashed_password}, user.full_name or user.email
        )

        return {"message": "Password changed successfully"}

    def update_user(self, user_id: int, user_update: dict, user_name: str | None = None):
        """Update a user"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Check if email is being updated and if it already exists
        if "email" in user_update and user_update["email"] != user.email:
            existing_user = self.repository.get_by_email(user_update["email"])
            if existing_user:
                raise ValidationError("User with this email already exists")

        return self.repository.update(user, user_update, user_name)

    def get_all_users(self):
        """Get all users"""
        return self.repository.get_all()

    def delete_user(self, user_id: int):
        """Delete a user"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        self.repository.delete(user)
        return {"message": "User deleted successfully"}
