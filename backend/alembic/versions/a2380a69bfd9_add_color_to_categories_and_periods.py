"""add_color_to_categories_and_periods

Revision ID: a2380a69bfd9
Revises: c1dc44446e42
Create Date: 2025-11-22 13:53:30.808184

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a2380a69bfd9"
down_revision: str | Sequence[str] | None = "c1dc44446e42"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add color column to categories
    op.add_column(
        "categories", sa.Column("color", sa.String(), nullable=False, server_default="#8b5cf6")
    )

    # Add color column to periods
    op.add_column(
        "periods", sa.Column("color", sa.String(), nullable=False, server_default="#8b5cf6")
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("periods", "color")
    op.drop_column("categories", "color")
