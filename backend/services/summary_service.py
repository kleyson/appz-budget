"""Summary service for calculating totals"""

from repositories import ExpenseRepository, IncomeRepository, PeriodRepository


class SummaryService:
    """Service for calculating summary totals"""

    def __init__(
        self,
        expense_repository: ExpenseRepository,
        income_repository: IncomeRepository,
        period_repository: PeriodRepository | None = None,
    ):
        self.expense_repository = expense_repository
        self.income_repository = income_repository
        self.period_repository = period_repository

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

    def get_period_summary(self, month_id: int | None = None) -> dict:
        """Get summary totals grouped by period"""
        if not self.period_repository:
            raise ValueError("Period repository is required for period summary")

        periods = self.period_repository.get_all()
        period_summaries = []
        grand_total_income = 0.0
        grand_total_expenses = 0.0

        for period in periods:
            expenses = self.expense_repository.get_all(period=period.name, month_id=month_id)
            incomes = self.income_repository.get_all(period=period.name, month_id=month_id)

            total_income = sum(income.amount or 0.0 for income in incomes)
            total_expenses = sum(expense.cost or 0.0 for expense in expenses)
            difference = total_income - total_expenses

            period_summaries.append(
                {
                    "period": period.name,
                    "color": period.color,
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "difference": difference,
                }
            )

            grand_total_income += total_income
            grand_total_expenses += total_expenses

        return {
            "periods": period_summaries,
            "grand_total_income": grand_total_income,
            "grand_total_expenses": grand_total_expenses,
            "grand_total_difference": grand_total_income - grand_total_expenses,
        }
