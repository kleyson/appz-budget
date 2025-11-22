"""Income type service for business logic"""

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import IncomeRepository, IncomeTypeRepository
from schemas import IncomeTypeCreate, IncomeTypeSummary, IncomeTypeUpdate


class IncomeTypeService:
    """Service for income type business logic"""

    def __init__(
        self,
        income_type_repository: IncomeTypeRepository,
        income_repository: IncomeRepository | None = None,
    ):
        self.repository = income_type_repository
        self.income_repository = income_repository

    def get_income_types(self) -> list:
        """Get all income types"""
        return self.repository.get_all()

    def create_income_type(self, income_type_data: IncomeTypeCreate, user_name: str | None = None):
        """Create a new income type"""
        # Business logic: Check if income type already exists
        existing = self.repository.get_by_name(income_type_data.name)
        if existing:
            raise ConflictError("Income type already exists")

        return self.repository.create(income_type_data.name, income_type_data.color, user_name)

    def update_income_type(
        self,
        income_type_id: int,
        income_type_update: IncomeTypeUpdate,
        user_name: str | None = None,
    ):
        """Update an income type"""
        income_type = self.repository.get_by_id(income_type_id)
        if not income_type:
            raise NotFoundError("Income type not found")

        # Business logic: Check if new name already exists
        if self.repository.exists_by_name(income_type_update.name, exclude_id=income_type_id):
            raise ConflictError("Income type name already exists")

        return self.repository.update(
            income_type, income_type_update.name, income_type_update.color, user_name
        )

    def delete_income_type(self, income_type_id: int):
        """Delete an income type"""
        income_type = self.repository.get_by_id(income_type_id)
        if not income_type:
            raise NotFoundError("Income type not found")

        # Business logic: Check if income type is used in incomes
        if self.income_repository:
            income_count = self.income_repository.count_by_income_type(income_type_id)
            if income_count > 0:
                raise DependencyError(
                    f"Cannot delete income type: it is used by {income_count} income(s)",
                    count=income_count,
                )

        self.repository.delete(income_type)
        return {"message": "Income type deleted successfully"}

    def get_income_type_summary(
        self, period: str | None = None, month_id: int | None = None
    ) -> list[IncomeTypeSummary]:
        """Get income type summary with budget totals and actual amounts"""
        if not self.income_repository:
            return []

        # Use get_all to support both period and month_id filtering
        if month_id is not None:
            incomes = self.income_repository.get_all(period=period, month_id=month_id)
        else:
            incomes = self.income_repository.get_by_period(period)

        # Business logic: Group by income type and calculate totals
        income_type_data = {}
        for income in incomes:
            # Get income type name from the relationship
            income_type_name = income.income_type_obj.name if income.income_type_obj else "Unknown"
            if income_type_name not in income_type_data:
                income_type_data[income_type_name] = {
                    "income_type": income_type_name,
                    "budget": 0.0,
                    "total": 0.0,
                }
            income_type_data[income_type_name]["budget"] += income.budget or 0.0
            income_type_data[income_type_name]["total"] += income.amount or 0.0

        # Convert to list
        summaries = []
        for it_data in income_type_data.values():
            summaries.append(
                IncomeTypeSummary(
                    income_type=it_data["income_type"],
                    budget=it_data["budget"],
                    total=it_data["total"],
                )
            )

        return sorted(summaries, key=lambda x: x.income_type)
