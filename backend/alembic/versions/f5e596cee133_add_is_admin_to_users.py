"""add_is_admin_to_users

Revision ID: f5e596cee133
Revises: b5f3a2c8d9e1
Create Date: 2025-11-22 21:56:05.080685

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f5e596cee133"
down_revision: str | Sequence[str] | None = "b5f3a2c8d9e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=True, server_default="0"))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "is_admin")
