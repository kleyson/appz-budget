"""add_audit_fields_to_all_tables

Revision ID: c2adb22eb41d
Revises: f5e596cee133
Create Date: 2025-11-22 22:02:44.115428

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import text

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c2adb22eb41d"
down_revision: str | Sequence[str] | None = "f5e596cee133"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # SQLite doesn't support ALTER COLUMN to change nullability, so we add columns as nullable
    # and set defaults. The model will enforce non-null at the application level.

    # Helper function to check if column exists
    def column_exists(table_name: str, column_name: str) -> bool:
        conn = op.get_bind()
        result = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
        return any(col[1] == column_name for col in result)

    # Add audit fields to expenses table
    if not column_exists("expenses", "created_at"):
        op.add_column("expenses", sa.Column("created_at", sa.DateTime(), nullable=True))
    if not column_exists("expenses", "updated_at"):
        op.add_column("expenses", sa.Column("updated_at", sa.DateTime(), nullable=True))
    if not column_exists("expenses", "created_by"):
        op.add_column("expenses", sa.Column("created_by", sa.String(), nullable=True))
    if not column_exists("expenses", "updated_by"):
        op.add_column("expenses", sa.Column("updated_by", sa.String(), nullable=True))
    # Set default values for existing rows
    op.execute(
        "UPDATE expenses SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at IS NULL"
    )

    # Add audit fields to categories table
    if not column_exists("categories", "created_at"):
        op.add_column("categories", sa.Column("created_at", sa.DateTime(), nullable=True))
    if not column_exists("categories", "updated_at"):
        op.add_column("categories", sa.Column("updated_at", sa.DateTime(), nullable=True))
    if not column_exists("categories", "created_by"):
        op.add_column("categories", sa.Column("created_by", sa.String(), nullable=True))
    if not column_exists("categories", "updated_by"):
        op.add_column("categories", sa.Column("updated_by", sa.String(), nullable=True))
    # Set default values for existing rows
    op.execute(
        "UPDATE categories SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at IS NULL"
    )

    # Add audit fields to periods table
    if not column_exists("periods", "created_at"):
        op.add_column("periods", sa.Column("created_at", sa.DateTime(), nullable=True))
    if not column_exists("periods", "updated_at"):
        op.add_column("periods", sa.Column("updated_at", sa.DateTime(), nullable=True))
    if not column_exists("periods", "created_by"):
        op.add_column("periods", sa.Column("created_by", sa.String(), nullable=True))
    if not column_exists("periods", "updated_by"):
        op.add_column("periods", sa.Column("updated_by", sa.String(), nullable=True))
    # Set default values for existing rows
    op.execute(
        "UPDATE periods SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at IS NULL"
    )

    # Add audit fields to months table
    if not column_exists("months", "created_at"):
        op.add_column("months", sa.Column("created_at", sa.DateTime(), nullable=True))
    if not column_exists("months", "updated_at"):
        op.add_column("months", sa.Column("updated_at", sa.DateTime(), nullable=True))
    if not column_exists("months", "created_by"):
        op.add_column("months", sa.Column("created_by", sa.String(), nullable=True))
    if not column_exists("months", "updated_by"):
        op.add_column("months", sa.Column("updated_by", sa.String(), nullable=True))
    # Set default values for existing rows
    op.execute(
        "UPDATE months SET created_at = datetime('now'), updated_at = datetime('now') WHERE created_at IS NULL"
    )

    # Add audit fields to users table (created_by and updated_by only, created_at/updated_at already exist)
    if not column_exists("users", "created_by"):
        op.add_column("users", sa.Column("created_by", sa.String(), nullable=True))
    if not column_exists("users", "updated_by"):
        op.add_column("users", sa.Column("updated_by", sa.String(), nullable=True))
    # Set defaults for existing rows if needed
    op.execute("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL")
    op.execute("UPDATE users SET updated_at = datetime('now') WHERE updated_at IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "updated_by")
    op.drop_column("users", "created_by")
    op.drop_column("months", "updated_by")
    op.drop_column("months", "created_by")
    op.drop_column("months", "updated_at")
    op.drop_column("months", "created_at")
    op.drop_column("periods", "updated_by")
    op.drop_column("periods", "created_by")
    op.drop_column("periods", "updated_at")
    op.drop_column("periods", "created_at")
    op.drop_column("categories", "updated_by")
    op.drop_column("categories", "created_by")
    op.drop_column("categories", "updated_at")
    op.drop_column("categories", "created_at")
    op.drop_column("expenses", "updated_by")
    op.drop_column("expenses", "created_by")
    op.drop_column("expenses", "updated_at")
    op.drop_column("expenses", "created_at")
