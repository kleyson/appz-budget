"""Month service for business logic"""

from calendar import monthrange
from datetime import date, datetime

from exceptions import ConflictError, NotFoundError, ValidationError
from repositories.month_repository import MonthRepository


def _month_to_dict(month) -> dict:
    """Convert month model to dictionary with all required fields"""
    # Handle cases where timestamps might be None (for older records)
    created_at = month.created_at if month.created_at else datetime.utcnow()
    updated_at = month.updated_at if month.updated_at else datetime.utcnow()
    return {
        "id": month.id,
        "year": month.year,
        "month": month.month,
        "name": month.name,
        "start_date": month.start_date.isoformat(),
        "end_date": month.end_date.isoformat(),
        "created_at": created_at,
        "updated_at": updated_at,
        "created_by": month.created_by,
        "updated_by": month.updated_by,
    }


class MonthService:
    """Service for month business logic"""

    def __init__(self, repository: MonthRepository):
        self.repository = repository

    def _generate_month_name(self, year: int, month: int) -> str:
        """Generate month name in format 'Month Year' (e.g., 'November 2024')"""
        month_names = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]
        return f"{month_names[month - 1]} {year}"

    def _get_month_dates(self, year: int, month: int) -> tuple[date, date]:
        """Get start and end dates for a month"""
        start_date = date(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = date(year, month, last_day)
        return start_date, end_date

    def create(self, month_data: dict, user_name: str | None = None) -> dict:
        """Create a new month"""
        year = month_data["year"]
        month_num = month_data["month"]

        # Validate month number
        if month_num < 1 or month_num > 12:
            raise ValidationError("Month must be between 1 and 12")

        # Check if month already exists
        if self.repository.exists(year, month_num):
            raise ConflictError(
                f"Month {self._generate_month_name(year, month_num)} already exists"
            )

        # Generate month name and dates
        start_date, end_date = self._get_month_dates(year, month_num)
        month_name = self._generate_month_name(year, month_num)

        month_dict = {
            "year": year,
            "month": month_num,
            "name": month_name,
            "start_date": start_date,
            "end_date": end_date,
        }

        month = self.repository.create(month_dict, user_name)
        return _month_to_dict(month)

    def get_by_id(self, month_id: int) -> dict:
        """Get month by ID"""
        month = self.repository.get_by_id(month_id)
        if not month:
            raise NotFoundError(f"Month with ID {month_id} not found")

        return _month_to_dict(month)

    def get_by_year_month(self, year: int, month: int) -> dict | None:
        """Get month by year and month number"""
        month_obj = self.repository.get_by_year_month(year, month)
        if not month_obj:
            return None

        return _month_to_dict(month_obj)

    def get_all(self) -> list[dict]:
        """Get all months"""
        months = self.repository.get_all()
        return [_month_to_dict(month) for month in months]

    def get_current(self) -> dict | None:
        """Get current month, or most recent month if current doesn't exist"""
        month = self.repository.get_current()

        # If current month doesn't exist, return the most recent month
        if not month:
            all_months = self.repository.get_all()
            if all_months:
                month = all_months[0]  # Already sorted by year desc, month desc
            else:
                return None

        return _month_to_dict(month)

    def update(self, month_id: int, month_data: dict, user_name: str | None = None) -> dict:
        """Update a month"""
        month = self.repository.get_by_id(month_id)
        if not month:
            raise NotFoundError(f"Month with ID {month_id} not found")

        update_data = month_data.copy()

        # If year or month is being updated, regenerate name and dates
        if "year" in update_data or "month" in update_data:
            year = update_data.get("year", month.year)
            month_num = update_data.get("month", month.month)

            if month_num < 1 or month_num > 12:
                raise ValidationError("Month must be between 1 and 12")

            # Check if new month already exists (and it's different from current)
            if (year != month.year or month_num != month.month) and self.repository.exists(
                year, month_num
            ):
                raise ConflictError(
                    f"Month {self._generate_month_name(year, month_num)} already exists"
                )

            start_date, end_date = self._get_month_dates(year, month_num)
            update_data["name"] = self._generate_month_name(year, month_num)
            update_data["start_date"] = start_date
            update_data["end_date"] = end_date

        # Convert date strings to date objects if present
        if "start_date" in update_data and isinstance(update_data["start_date"], str):
            update_data["start_date"] = datetime.fromisoformat(update_data["start_date"]).date()
        if "end_date" in update_data and isinstance(update_data["end_date"], str):
            update_data["end_date"] = datetime.fromisoformat(update_data["end_date"]).date()

        updated_month = self.repository.update(month, update_data, user_name)
        return {
            "id": updated_month.id,
            "year": updated_month.year,
            "month": updated_month.month,
            "name": updated_month.name,
            "start_date": updated_month.start_date.isoformat(),
            "end_date": updated_month.end_date.isoformat(),
            "created_at": updated_month.created_at,
            "updated_at": updated_month.updated_at,
            "created_by": updated_month.created_by,
            "updated_by": updated_month.updated_by,
        }

    def delete(self, month_id: int) -> None:
        """Delete a month and all associated expenses and incomes"""
        month = self.repository.get_by_id(month_id)
        if not month:
            raise NotFoundError(f"Month with ID {month_id} not found")

        # Delete all associated expenses
        if month.expenses:
            for expense in month.expenses:
                self.repository.db.delete(expense)
            self.repository.db.commit()

        # Delete all associated incomes
        if month.incomes:
            for income in month.incomes:
                self.repository.db.delete(income)
            self.repository.db.commit()

        # Delete the month itself
        self.repository.delete(month)
