"""add_budget_field_to_incomes

Revision ID: a87de63d5312
Revises: fb0f8b873883
Create Date: 2025-11-22 23:09:33.035424

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a87de63d5312"
down_revision: str | Sequence[str] | None = "fb0f8b873883"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Add budget column to incomes table
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column("budget", sa.Float(), nullable=True, server_default="0.0")
            )
    else:
        op.add_column(
            "incomes", sa.Column("budget", sa.Float(), nullable=True, server_default="0.0")
        )

    # Set default value for existing rows
    connection.execute(sa.text("UPDATE incomes SET budget = 0.0 WHERE budget IS NULL"))

    # Make it non-nullable
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            batch_op.alter_column("budget", nullable=False, server_default="0.0")
    else:
        op.alter_column("incomes", "budget", nullable=False, server_default="0.0")


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            batch_op.drop_column("budget")
    else:
        op.drop_column("incomes", "budget")
