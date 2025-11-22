"""User repository for database operations"""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import PasswordResetToken, User


class UserRepository:
    """Repository for user database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, user_data: dict, user_name: str | None = None) -> User:
        """Create a new user"""
        if user_name:
            user_data["created_by"] = user_name
            user_data["updated_by"] = user_name
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self) -> list[User]:
        """Get all users"""
        return self.db.query(User).order_by(User.email).all()

    def update(self, user: User, user_data: dict, user_name: str | None = None) -> User:
        """Update a user"""
        if user_name:
            user_data["updated_by"] = user_name
        for key, value in user_data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_reset_token(
        self, user_id: int, token: str, expires_in_hours: int = 24
    ) -> PasswordResetToken:
        """Create a password reset token"""
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=expires_in_hours),
        )
        self.db.add(reset_token)
        self.db.commit()
        self.db.refresh(reset_token)
        return reset_token

    def get_reset_token(self, token: str) -> PasswordResetToken | None:
        """Get a password reset token by token string"""
        return (
            self.db.query(PasswordResetToken)
            .filter(PasswordResetToken.token == token, ~PasswordResetToken.used)
            .first()
        )

    def mark_reset_token_used(self, reset_token: PasswordResetToken) -> None:
        """Mark a password reset token as used"""
        reset_token.used = True
        self.db.commit()

    def delete_expired_tokens(self) -> None:
        """Delete expired password reset tokens"""
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at < datetime.utcnow()
        ).delete()
        self.db.commit()

    def delete(self, user: User) -> None:
        """Delete a user"""
        self.db.delete(user)
        self.db.commit()
