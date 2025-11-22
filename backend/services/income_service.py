"""Income service for business logic"""

from exceptions import NotFoundError, ValidationError
from repositories import IncomeRepository, IncomeTypeRepository, MonthRepository
from schemas import IncomeCreate, IncomeUpdate


class IncomeService:
    """Service for income business logic"""

    def __init__(
        self,
        income_repository: IncomeRepository,
        month_repository: MonthRepository | None = None,
        income_type_repository: IncomeTypeRepository | None = None,
    ):
        self.repository = income_repository
        self.month_repository = month_repository
        self.income_type_repository = income_type_repository

    def create_income(self, income_data: IncomeCreate, user_name: str | None = None):
        """Create a new income"""
        # Validate month_id exists if month_repository is provided
        if self.month_repository:
            month = self.month_repository.get_by_id(income_data.month_id)
            if not month:
                raise ValidationError(f"Month with ID {income_data.month_id} not found")

        # Validate income_type_id exists if income_type_repository is provided
        if self.income_type_repository:
            income_type = self.income_type_repository.get_by_id(income_data.income_type_id)
            if not income_type:
                raise ValidationError(f"Income type with ID {income_data.income_type_id} not found")

        income_dict = income_data.model_dump()
        if income_dict.get("budget") is None:
            income_dict["budget"] = 0.0
        if income_dict.get("amount") is None:
            income_dict["amount"] = 0.0

        return self.repository.create(income_dict, user_name)

    def get_income(self, income_id: int):
        """Get income by ID"""
        income = self.repository.get_by_id(income_id)
        if not income:
            raise NotFoundError(f"Income with ID {income_id} not found")
        return income

    def get_incomes(
        self,
        period: str | None = None,
        income_type_id: int | None = None,
        month_id: int | None = None,
    ):
        """Get all incomes, optionally filtered"""
        return self.repository.get_all(
            period=period, income_type_id=income_type_id, month_id=month_id
        )

    def update_income(
        self, income_id: int, income_data: IncomeUpdate, user_name: str | None = None
    ):
        """Update an income"""
        income = self.repository.get_by_id(income_id)
        if not income:
            raise NotFoundError(f"Income with ID {income_id} not found")

        income_dict = income_data.model_dump(exclude_unset=True)

        # Validate month_id if provided
        if "month_id" in income_dict and self.month_repository:
            month = self.month_repository.get_by_id(income_dict["month_id"])
            if not month:
                raise ValidationError(f"Month with ID {income_dict['month_id']} not found")

        # Validate income_type_id if provided
        if "income_type_id" in income_dict and self.income_type_repository:
            income_type = self.income_type_repository.get_by_id(income_dict["income_type_id"])
            if not income_type:
                raise ValidationError(
                    f"Income type with ID {income_dict['income_type_id']} not found"
                )

        return self.repository.update(income, income_dict, user_name)

    def delete_income(self, income_id: int):
        """Delete an income"""
        income = self.repository.get_by_id(income_id)
        if not income:
            raise NotFoundError(f"Income with ID {income_id} not found")
        self.repository.delete(income)
