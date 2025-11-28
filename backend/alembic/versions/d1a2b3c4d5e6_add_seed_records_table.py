"""add_seed_records_table

Revision ID: d1a2b3c4d5e6
Revises: c908e171fb3a
Create Date: 2025-01-28 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = "c908e171fb3a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "seed_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("seed_id", sa.String(), nullable=False),
        sa.Column("executed_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_seed_records_id"), "seed_records", ["id"], unique=False)
    op.create_index(op.f("ix_seed_records_seed_id"), "seed_records", ["seed_id"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_seed_records_seed_id"), table_name="seed_records")
    op.drop_index(op.f("ix_seed_records_id"), table_name="seed_records")
    op.drop_table("seed_records")
