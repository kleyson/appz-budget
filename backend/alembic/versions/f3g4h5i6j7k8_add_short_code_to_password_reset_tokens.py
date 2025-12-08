"""add_short_code_to_password_reset_tokens

Revision ID: f3g4h5i6j7k8
Revises: e2f3a4b5c6d7
Create Date: 2025-12-08 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3g4h5i6j7k8"
down_revision: str | Sequence[str] | None = "e2f3a4b5c6d7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add short_code column to password_reset_tokens table
    op.add_column(
        "password_reset_tokens",
        sa.Column("short_code", sa.String(length=8), nullable=True),
    )
    # Create index on short_code for efficient lookups
    op.create_index(
        op.f("ix_password_reset_tokens_short_code"),
        "password_reset_tokens",
        ["short_code"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_password_reset_tokens_short_code"), table_name="password_reset_tokens")
    op.drop_column("password_reset_tokens", "short_code")
