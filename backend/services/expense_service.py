"""Expense service for business logic"""

from exceptions import NotFoundError, ValidationError
from repositories import ExpenseRepository, IncomeRepository, MonthRepository
from schemas import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    """Service for expense business logic"""

    def __init__(
        self,
        expense_repository: ExpenseRepository,
        month_repository: MonthRepository | None = None,
        income_repository: IncomeRepository | None = None,
    ):
        self.repository = expense_repository
        self.month_repository = month_repository
        self.income_repository = income_repository

    def create_expense(self, expense_data: ExpenseCreate, user_name: str | None = None):
        """Create a new expense"""
        # Validate month_id exists if month_repository is provided
        if self.month_repository:
            month = self.month_repository.get_by_id(expense_data.month_id)
            if not month:
                raise ValidationError(f"Month with ID {expense_data.month_id} not found")

        expense_dict = expense_data.model_dump()

        # Calculate cost from purchases if they exist and are not empty
        if expense_dict.get("purchases") and len(expense_dict["purchases"]) > 0:
            total_from_purchases = sum(
                item.get("amount", 0.0) for item in expense_dict["purchases"]
            )
            expense_dict["cost"] = total_from_purchases
        elif expense_dict.get("cost") is None:
            expense_dict["cost"] = 0.0
        else:
            # If cost is provided but no purchases, set purchases to None
            expense_dict["purchases"] = None

        return self.repository.create(expense_dict, user_name)

    def get_expense(self, expense_id: int):
        """Get expense by ID"""
        expense = self.repository.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("Expense not found")
        return expense

    def get_expenses(
        self, period: str | None = None, category: str | None = None, month_id: int | None = None
    ) -> list:
        """Get all expenses, optionally filtered"""
        return self.repository.get_all(period=period, category=category, month_id=month_id)

    def update_expense(
        self, expense_id: int, expense_update: ExpenseUpdate, user_name: str | None = None
    ):
        """Update an expense"""
        expense = self.repository.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("Expense not found")

        update_data = expense_update.model_dump(exclude_unset=True)

        # Validate month_id exists if it's being updated and month_repository is provided
        if "month_id" in update_data and self.month_repository:
            month = self.month_repository.get_by_id(update_data["month_id"])
            if not month:
                raise ValidationError(f"Month with ID {update_data['month_id']} not found")

        # Calculate cost from purchases if they're being updated
        if "purchases" in update_data:
            if update_data["purchases"] and len(update_data["purchases"]) > 0:
                total_from_purchases = sum(
                    item.get("amount", 0.0) for item in update_data["purchases"]
                )
                update_data["cost"] = total_from_purchases
            else:
                # If purchases is empty list or None, set to None and keep existing cost if cost wasn't provided
                update_data["purchases"] = None
                if "cost" not in update_data:
                    # Keep existing cost
                    pass

        return self.repository.update(expense, update_data, user_name)

    def delete_expense(self, expense_id: int):
        """Delete an expense"""
        expense = self.repository.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("Expense not found")

        self.repository.delete(expense)
        return {"message": "Expense deleted successfully"}

    def clone_to_next_month(self, month_id: int, user_name: str | None = None):
        """Clone all expenses from a month to the following month"""
        if not self.month_repository:
            raise ValidationError("Month repository is required for cloning")

        # Get the source month
        source_month = self.month_repository.get_by_id(month_id)
        if not source_month:
            raise NotFoundError(f"Month with ID {month_id} not found")

        # Calculate next month
        next_year = source_month.year
        next_month_num = source_month.month + 1
        if next_month_num > 12:
            next_month_num = 1
            next_year += 1

        # Get or create the next month
        next_month = self.month_repository.get_by_year_month(next_year, next_month_num)
        if not next_month:
            # Create the next month using the repository directly
            from calendar import monthrange
            from datetime import date

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
            month_name = f"{month_names[next_month_num - 1]} {next_year}"
            start_date = date(next_year, next_month_num, 1)
            _, last_day = monthrange(next_year, next_month_num)
            end_date = date(next_year, next_month_num, last_day)

            month_dict = {
                "year": next_year,
                "month": next_month_num,
                "name": month_name,
                "start_date": start_date,
                "end_date": end_date,
            }
            next_month = self.month_repository.create(month_dict, user_name)
            # Force SQLAlchemy to reload the object from the database to ensure
            # all fields including timestamps are loaded
            from sqlalchemy.orm import object_session

            session = object_session(next_month)
            if session:
                session.expire(next_month)
                session.refresh(next_month)

        # Get all expenses from the source month
        source_expenses = self.repository.get_all(month_id=month_id)

        # Clone each expense
        cloned_expense_count = 0
        for expense in source_expenses:
            # Create a new expense with the same data but reset cost and purchases
            expense_dict = {
                "expense_name": expense.expense_name,
                "period": expense.period,
                "category": expense.category,
                "budget": expense.budget,
                "cost": 0.0,  # Reset cost
                "notes": expense.notes,
                "month_id": next_month.id,
                "purchases": None,  # Reset purchases
            }
            self.repository.create(expense_dict, user_name)
            cloned_expense_count += 1

        # Clone incomes if income_repository is available
        cloned_income_count = 0
        if self.income_repository:
            source_incomes = self.income_repository.get_all(month_id=month_id)
            for income in source_incomes:
                # Create a new income with only budget values (reset amount)
                income_dict = {
                    "income_type_id": income.income_type_id,
                    "period": income.period,
                    "budget": income.budget,
                    "amount": 0.0,  # Reset amount
                    "month_id": next_month.id,
                }
                self.income_repository.create(income_dict, user_name)
                cloned_income_count += 1

        # Build success message
        messages = []
        if cloned_expense_count > 0:
            messages.append(f"{cloned_expense_count} expense(s)")
        if cloned_income_count > 0:
            messages.append(f"{cloned_income_count} income(s)")

        if messages:
            message = f"Successfully cloned {', '.join(messages)} to {next_month.name}"
        else:
            message = f"No data to clone for {next_month.name}"

        return {
            "message": message,
            "cloned_count": cloned_expense_count,
            "cloned_income_count": cloned_income_count,
            "next_month_id": next_month.id,
            "next_month_name": next_month.name,
        }
