"""Summary service for calculating totals"""

from repositories import ExpenseRepository, IncomeRepository


class SummaryService:
    """Service for calculating summary totals"""

    def __init__(
        self,
        expense_repository: ExpenseRepository,
        income_repository: IncomeRepository,
    ):
        self.expense_repository = expense_repository
        self.income_repository = income_repository

    def get_summary_totals(self, period: str | None = None, month_id: int | None = None) -> dict:
        """Get summary totals for expenses and income"""
        # Get expenses
        expenses = self.expense_repository.get_all(period=period, month_id=month_id)

        # Get incomes - need to use get_all with month_id filter
        incomes = self.income_repository.get_all(period=period, month_id=month_id)

        # Calculate expense totals
        total_budgeted_expenses = sum(expense.budget or 0.0 for expense in expenses)
        total_current_expenses = sum(expense.cost or 0.0 for expense in expenses)

        # Calculate income totals
        total_budgeted_income = sum(income.budget or 0.0 for income in incomes)
        total_current_income = sum(income.amount or 0.0 for income in incomes)

        # Calculate net totals
        total_budgeted = total_budgeted_income - total_budgeted_expenses
        total_current = total_current_income - total_current_expenses

        return {
            "total_budgeted_expenses": total_budgeted_expenses,
            "total_current_expenses": total_current_expenses,
            "total_budgeted_income": total_budgeted_income,
            "total_current_income": total_current_income,
            "total_budgeted": total_budgeted,
            "total_current": total_current,
        }
