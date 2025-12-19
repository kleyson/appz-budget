"""Tests for SummaryService"""

from repositories import ExpenseRepository, IncomeRepository
from services import SummaryService


class TestSummaryService:
    """Tests for SummaryService"""

    def test_get_summary_totals(self, test_db, sample_month, sample_expense, sample_income):
        """Test getting summary totals"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = SummaryService(expense_repo, income_repo)

        totals = service.get_summary_totals()
        assert "total_budgeted_expenses" in totals
        assert "total_current_expenses" in totals
        assert "total_budgeted_income" in totals
        assert "total_current_income" in totals
        assert "total_budgeted" in totals
        assert "total_current" in totals

    def test_get_summary_totals_calculations(self, test_db, sample_month):
        """Test summary totals calculations"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = SummaryService(expense_repo, income_repo)

        # Create expenses
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            }
        )
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 50.0,
                "cost": 60.0,
                "month_id": sample_month.id,
            }
        )

        # Create incomes
        from repositories import IncomeTypeRepository

        income_type_repo = IncomeTypeRepository(test_db)
        income_type = income_type_repo.create("Salary", "#10b981")

        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period 1",
                "budget": 2000.0,
                "amount": 1800.0,
                "month_id": sample_month.id,
            }
        )

        totals = service.get_summary_totals()
        assert totals["total_budgeted_expenses"] == 150.0
        assert totals["total_current_expenses"] == 150.0
        assert totals["total_budgeted_income"] == 7000.0
        assert totals["total_current_income"] == 6800.0
        assert totals["total_budgeted"] == 6850.0  # 7000 - 150
        assert totals["total_current"] == 6650.0  # 6800 - 150

    def test_get_summary_totals_filtered_by_period(self, test_db, sample_month):
        """Test summary totals filtered by period"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = SummaryService(expense_repo, income_repo)

        # Create expenses with different periods
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period A",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            }
        )
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period B",
                "category": "Category 1",
                "budget": 50.0,
                "cost": 60.0,
                "month_id": sample_month.id,
            }
        )

        # Create incomes with different periods
        from repositories import IncomeTypeRepository

        income_type_repo = IncomeTypeRepository(test_db)
        income_type = income_type_repo.create("Salary", "#10b981")

        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period A",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period B",
                "budget": 2000.0,
                "amount": 1800.0,
                "month_id": sample_month.id,
            }
        )

        totals = service.get_summary_totals(period="Period A")
        assert totals["total_budgeted_expenses"] == 100.0
        assert totals["total_current_expenses"] == 90.0
        assert totals["total_budgeted_income"] == 5000.0
        assert totals["total_current_income"] == 5000.0

    def test_get_summary_totals_filtered_by_month(self, test_db):
        """Test summary totals filtered by month"""
        from datetime import date

        from models import Month

        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = SummaryService(expense_repo, income_repo)

        # Create two months
        month1 = Month(
            year=2024,
            month=11,
            name="November 2024",
            start_date=date(2024, 11, 1),
            end_date=date(2024, 11, 30),
        )
        test_db.add(month1)
        test_db.commit()
        test_db.refresh(month1)

        month2 = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(month2)
        test_db.commit()
        test_db.refresh(month2)

        # Create expenses in different months
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": month1.id,
            }
        )
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 50.0,
                "cost": 60.0,
                "month_id": month2.id,
            }
        )

        # Create incomes in different months
        from repositories import IncomeTypeRepository

        income_type_repo = IncomeTypeRepository(test_db)
        income_type = income_type_repo.create("Salary", "#10b981")

        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": month1.id,
            }
        )
        income_repo.create(
            {
                "income_type_id": income_type.id,
                "period": "Period 1",
                "budget": 2000.0,
                "amount": 1800.0,
                "month_id": month2.id,
            }
        )

        totals = service.get_summary_totals(month_id=month1.id)
        assert totals["total_budgeted_expenses"] == 100.0
        assert totals["total_current_expenses"] == 90.0
        assert totals["total_budgeted_income"] == 5000.0
        assert totals["total_current_income"] == 5000.0

    def test_get_summary_totals_empty(self, test_db):
        """Test summary totals with no expenses or incomes"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = SummaryService(expense_repo, income_repo)

        totals = service.get_summary_totals()
        assert totals["total_budgeted_expenses"] == 0.0
        assert totals["total_current_expenses"] == 0.0
        assert totals["total_budgeted_income"] == 0.0
        assert totals["total_current_income"] == 0.0
        assert totals["total_budgeted"] == 0.0
        assert totals["total_current"] == 0.0
