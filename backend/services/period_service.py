"""Period service for business logic"""

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import ExpenseRepository, PeriodRepository
from schemas import PeriodCreate, PeriodUpdate


class PeriodService:
    """Service for period business logic"""

    def __init__(self, period_repository: PeriodRepository, expense_repository: ExpenseRepository):
        self.repository = period_repository
        self.expense_repository = expense_repository

    def get_periods(self) -> list:
        """Get all periods"""
        return self.repository.get_all()

    def create_period(self, period_data: PeriodCreate, user_name: str | None = None):
        """Create a new period"""
        # Business logic: Check if period already exists
        existing = self.repository.get_by_name(period_data.name)
        if existing:
            raise ConflictError("Period already exists")

        return self.repository.create(period_data.name, period_data.color, user_name)

    def update_period(
        self, period_id: int, period_update: PeriodUpdate, user_name: str | None = None
    ):
        """Update a period"""
        period = self.repository.get_by_id(period_id)
        if not period:
            raise NotFoundError("Period not found")

        # Business logic: Check if new name already exists
        if self.repository.exists_by_name(period_update.name, exclude_id=period_id):
            raise ConflictError("Period name already exists")

        # Business logic: Update expenses that use this period
        old_name = period.name
        updated_period = self.repository.update(
            period, period_update.name, period_update.color, user_name
        )
        self.expense_repository.update_period_name(old_name, period_update.name)

        return updated_period

    def delete_period(self, period_id: int):
        """Delete a period"""
        period = self.repository.get_by_id(period_id)
        if not period:
            raise NotFoundError("Period not found")

        # Business logic: Check if period is used in expenses
        expense_count = self.expense_repository.count_by_period(period.name)
        if expense_count > 0:
            raise DependencyError(
                f"Cannot delete period: it is used by {expense_count} expense(s)",
                count=expense_count,
            )

        self.repository.delete(period)
        return {"message": "Period deleted successfully"}
