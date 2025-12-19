"""add_month_table_and_foreign_key

Revision ID: ccb0d14d1d51
Revises: e4e1eaa1e6f2
Create Date: 2025-11-22 12:05:23.969139

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ccb0d14d1d51"
down_revision: str | Sequence[str] | None = "e4e1eaa1e6f2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    from datetime import date

    connection = op.get_bind()

    # Check if months table exists
    inspector = sa.inspect(connection)
    tables = inspector.get_table_names()
    months_table_exists = "months" in tables

    if not months_table_exists:
        # Create months table
        op.create_table(
            "months",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("year", sa.Integer(), nullable=False),
            sa.Column("month", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("end_date", sa.Date(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_months_id"), "months", ["id"], unique=False)
        op.create_index(op.f("ix_months_month"), "months", ["month"], unique=False)
        op.create_index(op.f("ix_months_name"), "months", ["name"], unique=True)
        op.create_index(op.f("ix_months_year"), "months", ["year"], unique=False)

    # Check if month_id column exists in expenses
    expenses_columns = [col["name"] for col in inspector.get_columns("expenses")]
    month_id_exists = "month_id" in expenses_columns

    if not month_id_exists:
        # Get current month if it exists, otherwise use the first available month
        today = date.today()
        result = connection.execute(
            sa.text(
                "SELECT id FROM months WHERE year = :year AND month = :month ORDER BY id LIMIT 1"
            ),
            {"year": today.year, "month": today.month},
        )
        row = result.fetchone()

        if not row:
            # Try to get any month
            result = connection.execute(
                sa.text("SELECT id FROM months ORDER BY id LIMIT 1"),
            )
            row = result.fetchone()

        default_month_id = row[0] if row else None

        # For SQLite, we need to use batch operations to add column and foreign key
        if connection.dialect.name == "sqlite":
            # Use batch operations for SQLite
            with op.batch_alter_table("expenses", schema=None) as batch_op:
                batch_op.add_column(sa.Column("month_id", sa.Integer(), nullable=True))

            # Set default month_id for existing expenses if we have a month
            if default_month_id:
                connection.execute(
                    sa.text("UPDATE expenses SET month_id = :month_id WHERE month_id IS NULL"),
                    {"month_id": default_month_id},
                )

            # Use batch operations to make it non-nullable and add constraints
            with op.batch_alter_table("expenses", schema=None) as batch_op:
                if default_month_id:
                    batch_op.alter_column("month_id", nullable=False)
                batch_op.create_foreign_key("fk_expenses_month_id", "months", ["month_id"], ["id"])

            # Create index (can be done outside batch)
            op.create_index(op.f("ix_expenses_month_id"), "expenses", ["month_id"], unique=False)
        else:
            # For other databases, use standard operations
            op.add_column("expenses", sa.Column("month_id", sa.Integer(), nullable=True))

            # Set default month_id for existing expenses if we have a month
            if default_month_id:
                connection.execute(
                    sa.text("UPDATE expenses SET month_id = :month_id WHERE month_id IS NULL"),
                    {"month_id": default_month_id},
                )

            if default_month_id:
                op.alter_column("expenses", "month_id", nullable=False)
            op.create_index(op.f("ix_expenses_month_id"), "expenses", ["month_id"], unique=False)
            op.create_foreign_key(None, "expenses", "months", ["month_id"], ["id"])
    else:
        # Column exists, but check if we need to update NULL values
        # Get current month if it exists
        today = date.today()
        result = connection.execute(
            sa.text(
                "SELECT id FROM months WHERE year = :year AND month = :month ORDER BY id LIMIT 1"
            ),
            {"year": today.year, "month": today.month},
        )
        row = result.fetchone()

        if not row:
            # Try to get any month
            result = connection.execute(
                sa.text("SELECT id FROM months ORDER BY id LIMIT 1"),
            )
            row = result.fetchone()

        if row:
            default_month_id = row[0]
            connection.execute(
                sa.text("UPDATE expenses SET month_id = :month_id WHERE month_id IS NULL"),
                {"month_id": default_month_id},
            )

        # Check if index exists
        indexes = [idx["name"] for idx in inspector.get_indexes("expenses")]
        if "ix_expenses_month_id" not in indexes:
            op.create_index(op.f("ix_expenses_month_id"), "expenses", ["month_id"], unique=False)

        # For SQLite, foreign keys are checked at runtime, so we don't need to create them
        # if they're already defined in the table schema


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, "expenses", type_="foreignkey")
    op.drop_index(op.f("ix_expenses_month_id"), table_name="expenses")
    op.drop_column("expenses", "month_id")
    op.drop_index(op.f("ix_months_year"), table_name="months")
    op.drop_index(op.f("ix_months_name"), table_name="months")
    op.drop_index(op.f("ix_months_month"), table_name="months")
    op.drop_index(op.f("ix_months_id"), table_name="months")
    op.drop_table("months")
    # ### end Alembic commands ###
