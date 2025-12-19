"""add_income_types_table_and_update_incomes

Revision ID: fb0f8b873883
Revises: cec4e4d0d327
Create Date: 2025-11-22 22:56:15.912527

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fb0f8b873883"
down_revision: str | Sequence[str] | None = "cec4e4d0d327"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()

    # Create income_types table
    op.create_table(
        "income_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=False, server_default="#10b981"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_income_types_id"), "income_types", ["id"], unique=False)
    op.create_index(op.f("ix_income_types_name"), "income_types", ["name"], unique=True)

    # Use batch operations for SQLite to alter table
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            # Add income_type_id column first
            batch_op.add_column(sa.Column("income_type_id", sa.Integer(), nullable=True))

        # Migrate existing data: Create income types from unique income_type strings
        result = connection.execute(
            sa.text("SELECT DISTINCT income_type FROM incomes WHERE income_type IS NOT NULL")
        )
        unique_types = [row[0] for row in result]

        for income_type_name in unique_types:
            connection.execute(
                sa.text(
                    "INSERT OR IGNORE INTO income_types (name, color, created_at, updated_at) VALUES (:name, :color, datetime('now'), datetime('now'))"
                ),
                {"name": income_type_name, "color": "#10b981"},
            )
            connection.execute(
                sa.text(
                    "UPDATE incomes SET income_type_id = (SELECT id FROM income_types WHERE name = :name LIMIT 1) WHERE income_type = :name"
                ),
                {"name": income_type_name},
            )

        # Continue with batch operations
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            # Make it non-nullable
            batch_op.alter_column("income_type_id", nullable=False)

            # Drop old column and index
            batch_op.drop_index("ix_incomes_income_type")
            batch_op.drop_column("income_type")

            # Add foreign key
            batch_op.create_foreign_key(
                "fk_incomes_income_type_id", "income_types", ["income_type_id"], ["id"]
            )

        # Create index (outside batch)
        op.create_index(
            op.f("ix_incomes_income_type_id"), "incomes", ["income_type_id"], unique=False
        )
    else:
        # For other databases
        op.add_column("incomes", sa.Column("income_type_id", sa.Integer(), nullable=True))

        # Migrate existing data
        result = connection.execute(
            sa.text("SELECT DISTINCT income_type FROM incomes WHERE income_type IS NOT NULL")
        )
        unique_types = [row[0] for row in result]

        for income_type_name in unique_types:
            connection.execute(
                sa.text(
                    "INSERT INTO income_types (name, color, created_at, updated_at) VALUES (:name, :color, NOW(), NOW()) ON CONFLICT DO NOTHING"
                ),
                {"name": income_type_name, "color": "#10b981"},
            )
            connection.execute(
                sa.text(
                    "UPDATE incomes SET income_type_id = (SELECT id FROM income_types WHERE name = :name LIMIT 1) WHERE income_type = :name"
                ),
                {"name": income_type_name},
            )

        op.alter_column("incomes", "income_type_id", nullable=False)
        op.drop_index(op.f("ix_incomes_income_type"), table_name="incomes")
        op.drop_column("incomes", "income_type")
        op.create_foreign_key(
            "fk_incomes_income_type_id", "incomes", "income_types", ["income_type_id"], ["id"]
        )
        op.create_index(
            op.f("ix_incomes_income_type_id"), "incomes", ["income_type_id"], unique=False
        )


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()

    # Migrate data back: convert income_type_id to income_type string
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("incomes", schema=None) as batch_op:
            # Add income_type column
            batch_op.add_column(sa.Column("income_type", sa.String(), nullable=True))

            # Update existing rows
            connection.execute(
                sa.text(
                    """
                UPDATE incomes
                SET income_type = (SELECT name FROM income_types WHERE id = incomes.income_type_id LIMIT 1)
                WHERE income_type IS NULL AND income_type_id IS NOT NULL
            """
                )
            )

            # Make it non-nullable
            batch_op.alter_column("income_type", nullable=False)

            # Drop foreign key and column
            batch_op.drop_constraint("fk_incomes_income_type_id", type_="foreignkey")
            batch_op.drop_column("income_type_id")

            # Create index
            batch_op.create_index("ix_incomes_income_type", ["income_type"], unique=False)
    else:
        op.add_column("incomes", sa.Column("income_type", sa.String(), nullable=True))
        connection.execute(
            sa.text(
                """
            UPDATE incomes
            SET income_type = (SELECT name FROM income_types WHERE id = incomes.income_type_id LIMIT 1)
            WHERE income_type IS NULL AND income_type_id IS NOT NULL
        """
            )
        )
        op.alter_column("incomes", "income_type", nullable=False)
        op.drop_index(op.f("ix_incomes_income_type_id"), table_name="incomes")
        op.drop_constraint("fk_incomes_income_type_id", "incomes", type_="foreignkey")
        op.drop_column("incomes", "income_type_id")
        op.create_index(op.f("ix_incomes_income_type"), "incomes", ["income_type"], unique=False)

    # Drop income_types table
    op.drop_index(op.f("ix_income_types_name"), table_name="income_types")
    op.drop_index(op.f("ix_income_types_id"), table_name="income_types")
    op.drop_table("income_types")
