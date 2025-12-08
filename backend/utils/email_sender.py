"""Email sender utility for password reset emails"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from utils.config import smtp_config

logger = logging.getLogger(__name__)


class EmailSender:
    """Email sender using SMTP"""

    def __init__(self):
        self.config = smtp_config

    def send_password_reset_email(
        self, to_email: str, reset_url: str, short_code: str, expires_minutes: int
    ) -> bool:
        """Send password reset email with both URL and short code

        Args:
            to_email: Recipient email address
            reset_url: Full URL for password reset
            short_code: Short numeric code for manual entry
            expires_minutes: Expiration time in minutes

        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.config.enabled:
            logger.info("SMTP not configured, skipping email send")
            return False

        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Password Reset Request"
            msg["From"] = self.config.from_email
            msg["To"] = to_email

            # Plain text version
            text_content = f"""
Password Reset Request

You requested a password reset for your account.

You can reset your password in two ways:

1. Click this link:
{reset_url}

2. Or use this code on the reset page:
{short_code}

This code will expire in {expires_minutes} minutes.

If you didn't request this, please ignore this email.
"""

            # HTML version
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background-color: #4f46e5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }}
        .content {{
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }}
        .code-box {{
            background-color: white;
            border: 2px solid #4f46e5;
            border-radius: 5px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }}
        .code {{
            font-size: 32px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: 3px;
        }}
        .button {{
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>You requested a password reset for your account.</p>

            <p><strong>Option 1:</strong> Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </div>

            <p><strong>Option 2:</strong> Or use this code on the reset page:</p>
            <div class="code-box">
                <div class="code">{short_code}</div>
            </div>

            <p>This code will expire in <strong>{expires_minutes} minutes</strong>.</p>

            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""

            # Attach both versions
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(self.config.host, self.config.port, timeout=10) as server:
                if self.config.use_tls:
                    server.starttls()
                if self.config.user and self.config.password:
                    server.login(self.config.user, self.config.password)
                server.send_message(msg)

            logger.info(f"Password reset email sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False


# Global email sender instance
email_sender = EmailSender()
