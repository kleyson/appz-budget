"""add_close_month_and_expense_date

Revision ID: e2f3a4b5c6d7
Revises: d1a2b3c4d5e6
Create Date: 2025-01-29 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: str | Sequence[str] | None = "d1a2b3c4d5e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_closed, closed_at, closed_by to months table
    op.add_column(
        "months", sa.Column("is_closed", sa.Boolean(), nullable=False, server_default="0")
    )
    op.add_column("months", sa.Column("closed_at", sa.DateTime(), nullable=True))
    op.add_column("months", sa.Column("closed_by", sa.String(), nullable=True))

    # Add expense_date to expenses table
    op.add_column("expenses", sa.Column("expense_date", sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove expense_date from expenses table
    op.drop_column("expenses", "expense_date")

    # Remove is_closed, closed_at, closed_by from months table
    op.drop_column("months", "closed_by")
    op.drop_column("months", "closed_at")
    op.drop_column("months", "is_closed")
