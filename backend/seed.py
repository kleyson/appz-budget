"""Seed script to create initial admin user and initial data"""

import random
import sys
from datetime import date

from database import SessionLocal
from repositories import (
    CategoryRepository,
    IncomeTypeRepository,
    MonthRepository,
    PeriodRepository,
    UserRepository,
)
from services.month_service import MonthService
from utils.auth import get_password_hash


def generate_random_color() -> str:
    """
    Generate a random color in hex format
    Generates a truly random hex color with good visibility
    Based on frontend logic: minimum value of 50 ensures colors aren't too dark, max is 255
    """
    # Generate random RGB values
    # Using a range that ensures good visibility (avoiding very dark colors)
    # Minimum value of 50 ensures colors aren't too dark, max is 255
    r = random.randint(50, 255)
    g = random.randint(50, 255)
    b = random.randint(50, 255)

    # Convert to hex format
    def to_hex(value: int) -> str:
        hex_str = hex(value)[2:]  # Remove '0x' prefix
        return hex_str.zfill(2)  # Pad with zero if needed

    return f"#{to_hex(r)}{to_hex(g)}{to_hex(b)}"


def seed_admin_user():
    """Create initial admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        user_repository = UserRepository(db)

        # Check if admin user already exists
        existing_user = user_repository.get_by_email("admin@email.com")
        if existing_user:
            # Update existing user to ensure they are admin
            if not existing_user.is_admin:
                user_repository.update(existing_user, {"is_admin": True})
                print("✓ Admin user updated to have admin privileges!")
            else:
                print("Admin user already exists. Skipping seed.")
            return

        # Create admin user
        admin_user = user_repository.create(
            {
                "email": "admin@email.com",
                "hashed_password": get_password_hash("admin"),
                "full_name": "Administrator",
                "is_active": True,
                "is_admin": True,
            }
        )

        print("✓ Admin user created successfully!")
        print("  Email: admin@email.com")
        print("  Password: admin")
        print(f"  User ID: {admin_user.id}")

    except Exception as e:
        print(f"Error creating admin user: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def seed_current_month():
    """Create current month if it doesn't exist"""
    db = SessionLocal()
    try:
        month_repository = MonthRepository(db)
        month_service = MonthService(month_repository)

        today = date.today()
        year = today.year
        month = today.month

        # Check if current month already exists
        existing_month = month_repository.get_by_year_month(year, month)
        if existing_month:
            print(
                f"✓ Current month ({month_service._generate_month_name(year, month)}) already exists. Skipping."
            )
            return

        # Create current month
        month_data = {"year": year, "month": month}
        month_service.create(month_data, "system")
        print(
            f"✓ Current month ({month_service._generate_month_name(year, month)}) created successfully!"
        )

    except Exception as e:
        print(f"Error creating current month: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def seed_categories():
    """Create initial categories if they don't exist"""
    db = SessionLocal()
    try:
        category_repository = CategoryRepository(db)

        categories = [
            "Groceries",
            "Transportation",
            "Insurance",
            "Subscriptions",
            "Rent/Utilities",
            "Going Out",
            "Purchases",
            "Health",
            "Investment/Savings",
            "Withdraw",
        ]

        created_count = 0
        skipped_count = 0

        for category_name in categories:
            existing_category = category_repository.get_by_name(category_name)
            if existing_category:
                skipped_count += 1
                continue

            color = generate_random_color()
            category_repository.create(category_name, color=color, user_name="system")
            created_count += 1

        if created_count > 0:
            print(f"✓ Created {created_count} categories")
        if skipped_count > 0:
            print(f"  {skipped_count} categories already exist")

    except Exception as e:
        print(f"Error creating categories: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def seed_income_types():
    """Create initial income types if they don't exist"""
    db = SessionLocal()
    try:
        income_type_repository = IncomeTypeRepository(db)

        income_types = [
            "Salary",
            "Carry Over",
            "Side Hustle",
            "Tax Return",
            "Investment Return",
            "Bonus",
        ]

        created_count = 0
        skipped_count = 0

        for income_type_name in income_types:
            existing_income_type = income_type_repository.get_by_name(income_type_name)
            if existing_income_type:
                skipped_count += 1
                continue

            color = generate_random_color()
            income_type_repository.create(income_type_name, color=color, user_name="system")
            created_count += 1

        if created_count > 0:
            print(f"✓ Created {created_count} income types")
        if skipped_count > 0:
            print(f"  {skipped_count} income types already exist")

    except Exception as e:
        print(f"Error creating income types: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def seed_periods():
    """Create initial periods if they don't exist"""
    db = SessionLocal()
    try:
        period_repository = PeriodRepository(db)

        periods = [
            "On Demand",
            "1st Period",
            "2nd Period",
        ]

        created_count = 0
        skipped_count = 0

        for period_name in periods:
            existing_period = period_repository.get_by_name(period_name)
            if existing_period:
                skipped_count += 1
                continue

            color = generate_random_color()
            period_repository.create(period_name, color=color, user_name="system")
            created_count += 1

        if created_count > 0:
            print(f"✓ Created {created_count} periods")
        if skipped_count > 0:
            print(f"  {skipped_count} periods already exist")

    except Exception as e:
        print(f"Error creating periods: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def seed_all():
    """Seed all initial data"""
    print("Seeding initial data...")
    print()
    seed_admin_user()
    print()
    seed_current_month()
    print()
    seed_categories()
    print()
    seed_income_types()
    print()
    seed_periods()
    print()
    print("✓ All initial data seeded successfully!")


if __name__ == "__main__":
    seed_all()
