"""User service for business logic"""

import logging
import os
from datetime import datetime

from exceptions import NotFoundError, ValidationError
from repositories import UserRepository
from utils.auth import generate_reset_token, generate_short_code, get_password_hash, verify_password
from utils.config import reset_config
from utils.email_sender import email_sender

logger = logging.getLogger(__name__)


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
            return {
                "message": "If the email exists, a password reset link has been sent",
                "email_sent": False,
            }

        # Generate both long token and short code
        token = generate_reset_token()
        short_code = generate_short_code(reset_config.code_length)

        # Create reset token record with short code
        self.repository.create_reset_token(
            user.id,
            token,
            short_code=short_code,
            expires_in_minutes=reset_config.code_expiration_minutes,
        )

        # Build reset URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={token}"

        # Log the reset code to stdout (visible in docker logs)
        log_message = f"""
╔══════════════════════════════════════════════════════════════════╗
║                    PASSWORD RESET REQUEST                        ║
╠══════════════════════════════════════════════════════════════════╣
║ User Email:  {email:<51} ║
║ Reset Code:  {short_code:<51} ║
║ Expires In:  {reset_config.code_expiration_minutes} minutes{" " * (51 - len(str(reset_config.code_expiration_minutes)) - 8)} ║
║ Reset URL:   {reset_url[:51]:<51} ║
╚══════════════════════════════════════════════════════════════════╝
"""
        logger.warning(log_message)

        # Try to send email if SMTP is configured
        email_sent = False
        try:
            email_sent = email_sender.send_password_reset_email(
                to_email=email,
                reset_url=reset_url,
                short_code=short_code,
                expires_minutes=reset_config.code_expiration_minutes,
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")

        return {
            "message": "Password reset requested. Check your email or contact admin for reset code.",
            "email_sent": email_sent,
        }

    def reset_password(self, token: str, new_password: str):
        """Reset password using a reset token or short code

        Args:
            token: Either a long token string or a short numeric code
            new_password: The new password to set

        Returns:
            Success message
        """
        # Try to find token by long token first
        reset_token = self.repository.get_reset_token(token)

        # If not found, try short code (if token looks like a numeric code)
        if not reset_token and token.isdigit():
            reset_token = self.repository.get_reset_token_by_short_code(token)

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

        logger.info(f"Password reset successful for user: {user.email}")

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

    def admin_set_password(self, user_id: int, new_password: str, admin_name: str):
        """Set password for any user (admin only, no current password required)"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Update password
        hashed_password = get_password_hash(new_password)
        self.repository.update(user, {"hashed_password": hashed_password}, admin_name)

        logger.info(f"Admin {admin_name} set password for user: {user.email}")

        return {"message": f"Password set successfully for {user.email}"}

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

    def get_active_password_resets(self):
        """Get all active password reset requests (admin only)"""
        reset_tokens = self.repository.get_active_reset_tokens()

        results = []
        for token in reset_tokens:
            user = self.repository.get_by_id(token.user_id)
            if user:
                # Calculate time remaining
                time_remaining = (token.expires_at - datetime.utcnow()).total_seconds()
                minutes_remaining = int(time_remaining / 60) if time_remaining > 0 else 0

                results.append(
                    {
                        "user_email": user.email,
                        "short_code": token.short_code,
                        "created_at": token.created_at.isoformat(),
                        "expires_at": token.expires_at.isoformat(),
                        "minutes_remaining": minutes_remaining,
                    }
                )

        return results

    def generate_reset_link_for_user(self, user_id: int):
        """Generate a password reset link for a specific user (admin only)"""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Generate both long token and short code
        token = generate_reset_token()
        short_code = generate_short_code(reset_config.code_length)

        # Create reset token record
        self.repository.create_reset_token(
            user.id,
            token,
            short_code=short_code,
            expires_in_minutes=reset_config.code_expiration_minutes,
        )

        # Build reset URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={token}"

        logger.info(f"Admin generated reset link for user: {user.email}")

        return {
            "user_email": user.email,
            "reset_url": reset_url,
            "short_code": short_code,
            "expires_in_minutes": reset_config.code_expiration_minutes,
        }
