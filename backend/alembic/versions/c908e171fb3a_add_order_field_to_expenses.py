"""add_order_field_to_expenses

Revision ID: c908e171fb3a
Revises: a87de63d5312
Create Date: 2025-01-27 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c908e171fb3a"
down_revision: str | Sequence[str] | None = "a87de63d5312"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Add order column to expenses table
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("expenses", schema=None) as batch_op:
            batch_op.add_column(sa.Column("order", sa.Integer(), nullable=True))
    else:
        op.add_column("expenses", sa.Column("order", sa.Integer(), nullable=True))

    # Set order values for existing rows based on their current order (by expense_name)
    # This will assign sequential order values starting from 0
    connection.execute(
        sa.text(
            """
            UPDATE expenses
            SET "order" = (
                SELECT COUNT(*)
                FROM expenses e2
                WHERE e2.month_id = expenses.month_id
                AND (e2.expense_name < expenses.expense_name
                     OR (e2.expense_name = expenses.expense_name AND e2.id < expenses.id))
            )
        """
        )
    )

    # Make it non-nullable with default 0
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("expenses", schema=None) as batch_op:
            batch_op.alter_column("order", nullable=False, server_default="0")
    else:
        op.alter_column("expenses", "order", nullable=False, server_default="0")


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("expenses", schema=None) as batch_op:
            batch_op.drop_column("order")
    else:
        op.drop_column("expenses", "order")
