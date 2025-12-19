"""Summary service for calculating totals"""

from repositories import (
    CategoryRepository,
    ExpenseRepository,
    IncomeRepository,
    MonthRepository,
    PeriodRepository,
)


class SummaryService:
    """Service for calculating summary totals"""

    def __init__(
        self,
        expense_repository: ExpenseRepository,
        income_repository: IncomeRepository,
        period_repository: PeriodRepository | None = None,
        month_repository: MonthRepository | None = None,
        category_repository: CategoryRepository | None = None,
    ):
        self.expense_repository = expense_repository
        self.income_repository = income_repository
        self.period_repository = period_repository
        self.month_repository = month_repository
        self.category_repository = category_repository

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

    def get_monthly_trends(self, num_months: int = 12) -> dict:
        """Get monthly trends for income, expenses, and category breakdown"""
        if not self.month_repository or not self.category_repository:
            raise ValueError("Month and category repositories are required for monthly trends")

        # Get all months sorted by year and month (most recent first)
        all_months = self.month_repository.get_all()
        sorted_months = sorted(all_months, key=lambda m: (m.year, m.month), reverse=True)

        # Take the requested number of months and reverse to show oldest first
        selected_months = sorted_months[:num_months][::-1]

        # Get all categories for color lookup
        categories = self.category_repository.get_all()
        category_colors = {cat.name: cat.color for cat in categories}

        monthly_data = []
        total_income = 0.0
        total_expenses = 0.0
        total_savings_rate = 0.0
        months_with_income = 0

        for month in selected_months:
            # Get expenses and incomes for this month
            expenses = self.expense_repository.get_all(month_id=month.id)
            incomes = self.income_repository.get_all(month_id=month.id)

            # Calculate totals
            month_income = sum(income.amount or 0.0 for income in incomes)
            month_expenses = sum(expense.cost or 0.0 for expense in expenses)
            net_savings = month_income - month_expenses

            # Calculate savings rate (avoid division by zero)
            savings_rate = 0.0
            if month_income > 0:
                savings_rate = (net_savings / month_income) * 100
                months_with_income += 1
                total_savings_rate += savings_rate

            # Group expenses by category
            category_totals: dict[str, float] = {}
            for expense in expenses:
                category = expense.category
                category_totals[category] = category_totals.get(category, 0.0) + (
                    expense.cost or 0.0
                )

            # Build category trend items
            category_items = [
                {
                    "category": cat_name,
                    "amount": amount,
                    "color": category_colors.get(cat_name, "#8b5cf6"),
                }
                for cat_name, amount in category_totals.items()
            ]

            monthly_data.append(
                {
                    "month_id": month.id,
                    "month_name": month.name,
                    "year": month.year,
                    "month": month.month,
                    "total_income": month_income,
                    "total_expenses": month_expenses,
                    "net_savings": net_savings,
                    "savings_rate": round(savings_rate, 1),
                    "categories": category_items,
                }
            )

            total_income += month_income
            total_expenses += month_expenses

        # Calculate averages
        num_data_months = len(monthly_data) or 1
        avg_income = total_income / num_data_months
        avg_expenses = total_expenses / num_data_months
        avg_savings_rate = (
            total_savings_rate / months_with_income if months_with_income > 0 else 0.0
        )

        return {
            "months": monthly_data,
            "average_income": round(avg_income, 2),
            "average_expenses": round(avg_expenses, 2),
            "average_savings_rate": round(avg_savings_rate, 1),
        }
