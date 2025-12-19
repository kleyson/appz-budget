"""Configuration for SMTP and password reset settings"""

import os
from dataclasses import dataclass


@dataclass
class SMTPConfig:
    """SMTP configuration for email sending"""

    enabled: bool
    host: str
    port: int
    user: str
    password: str
    from_email: str
    use_tls: bool

    @classmethod
    def from_env(cls) -> "SMTPConfig":
        """Load SMTP configuration from environment variables"""
        host = os.getenv("SMTP_HOST", "")

        return cls(
            enabled=bool(host),
            host=host,
            port=int(os.getenv("SMTP_PORT", "587")),
            user=os.getenv("SMTP_USER", ""),
            password=os.getenv("SMTP_PASSWORD", ""),
            from_email=os.getenv("SMTP_FROM", ""),
            use_tls=os.getenv("SMTP_USE_TLS", "true").lower() == "true",
        )


@dataclass
class PasswordResetConfig:
    """Password reset configuration"""

    code_length: int
    code_expiration_minutes: int
    token_expiration_hours: int

    @classmethod
    def from_env(cls) -> "PasswordResetConfig":
        """Load password reset configuration from environment variables"""
        return cls(
            code_length=int(os.getenv("RESET_CODE_LENGTH", "6")),
            code_expiration_minutes=int(os.getenv("RESET_CODE_EXPIRATION_MINUTES", "30")),
            token_expiration_hours=int(os.getenv("RESET_TOKEN_EXPIRATION_HOURS", "24")),
        )


# Global configuration instances
smtp_config = SMTPConfig.from_env()
reset_config = PasswordResetConfig.from_env()
