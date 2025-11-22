"""Tests for ExpenseService"""

from datetime import date

import pytest

from exceptions import NotFoundError, ValidationError
from models import Month
from repositories import ExpenseRepository, IncomeRepository, MonthRepository
from schemas import ExpenseCreate, ExpenseUpdate
from services import ExpenseService


class TestExpenseService:
    """Tests for ExpenseService"""

    def test_create_expense(self, test_db, sample_month):
        """Test creating an expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)
        assert expense.id is not None
        assert expense.expense_name == "Test Expense"

    def test_get_expense(self, test_db, sample_expense):
        """Test getting an expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        expense = service.get_expense(sample_expense.id)
        assert expense.id == sample_expense.id

    def test_get_expense_not_found(self, test_db):
        """Test getting non-existent expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        with pytest.raises(NotFoundError):
            service.get_expense(999)

    def test_get_expenses(self, test_db, sample_month):
        """Test getting all expenses"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 10.0,
                "cost": 10.0,
                "month_id": sample_month.id,
            }
        )
        expenses = service.get_expenses()
        assert len(expenses) == 1

    def test_update_expense(self, test_db, sample_expense):
        """Test updating an expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        update_data = ExpenseUpdate(expense_name="Updated Expense")
        updated = service.update_expense(sample_expense.id, update_data)
        assert updated.expense_name == "Updated Expense"

    def test_update_expense_not_found(self, test_db):
        """Test updating non-existent expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        update_data = ExpenseUpdate(expense_name="Updated")
        with pytest.raises(NotFoundError):
            service.update_expense(999, update_data)

    def test_delete_expense(self, test_db, sample_expense):
        """Test deleting an expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        result = service.delete_expense(sample_expense.id)
        assert result["message"] == "Expense deleted successfully"
        assert expense_repo.get_by_id(sample_expense.id) is None

    def test_delete_expense_not_found(self, test_db):
        """Test deleting non-existent expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)
        with pytest.raises(NotFoundError):
            service.delete_expense(999)

    def test_clone_to_next_month_success(self, test_db, sample_month, sample_income_type):
        """Test cloning expenses and incomes to next month when next month exists"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo, income_repo)

        # Create next month (December 2024)
        next_month = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(next_month)
        test_db.commit()
        test_db.refresh(next_month)

        # Create expenses in source month (November 2024)
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "notes": "Test notes",
                "month_id": sample_month.id,
                "purchases": [
                    {"name": "Item 1", "amount": 50.0},
                    {"name": "Item 2", "amount": 40.0},
                ],
            }
        )
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 2",
                "category": "Category 2",
                "budget": 200.0,
                "cost": 150.0,
                "notes": "Another expense",
                "month_id": sample_month.id,
                "purchases": None,
            }
        )

        # Create incomes in source month
        income_repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5200.0,
                "month_id": sample_month.id,
            }
        )

        # Clone expenses and incomes
        result = service.clone_to_next_month(sample_month.id)

        # Verify result
        assert result["cloned_count"] == 2
        assert result["cloned_income_count"] == 1
        assert result["next_month_id"] == next_month.id
        assert "Successfully cloned" in result["message"]
        assert "expense(s)" in result["message"]
        assert "income(s)" in result["message"]

        # Verify cloned expenses
        cloned_expenses = expense_repo.get_all(month_id=next_month.id)
        assert len(cloned_expenses) == 2

        # Verify expense 1 was cloned correctly
        cloned_exp1 = next((e for e in cloned_expenses if e.expense_name == "Expense 1"), None)
        assert cloned_exp1 is not None
        assert cloned_exp1.period == "Period 1"
        assert cloned_exp1.category == "Category 1"
        assert cloned_exp1.budget == 100.0
        assert cloned_exp1.cost == 0.0  # Cost should be reset
        assert cloned_exp1.purchases is None  # Purchases should be reset
        assert cloned_exp1.notes == "Test notes"

        # Verify expense 2 was cloned correctly
        cloned_exp2 = next((e for e in cloned_expenses if e.expense_name == "Expense 2"), None)
        assert cloned_exp2 is not None
        assert cloned_exp2.period == "Period 2"
        assert cloned_exp2.category == "Category 2"
        assert cloned_exp2.budget == 200.0
        assert cloned_exp2.cost == 0.0  # Cost should be reset
        assert cloned_exp2.purchases is None  # Purchases should be reset
        assert cloned_exp2.notes == "Another expense"

        # Verify cloned incomes
        cloned_incomes = income_repo.get_all(month_id=next_month.id)
        assert len(cloned_incomes) == 1
        cloned_income = cloned_incomes[0]
        assert cloned_income.income_type_id == sample_income_type.id
        assert cloned_income.period == "Period 1"
        assert cloned_income.budget == 5000.0
        assert cloned_income.amount == 0.0  # Amount should be reset

    def test_clone_to_next_month_creates_next_month(self, test_db, sample_month):
        """Test cloning expenses creates next month if it doesn't exist"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo, income_repo)

        # Create expense in source month
        expense_repo.create(
            {
                "expense_name": "Test Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 50.0,
                "cost": 45.0,
                "month_id": sample_month.id,
            }
        )

        # Clone expenses (next month doesn't exist yet)
        result = service.clone_to_next_month(sample_month.id)

        # Verify next month was created
        assert result["cloned_count"] == 1
        next_month = month_repo.get_by_year_month(2024, 12)
        assert next_month is not None
        assert next_month.name == "December 2024"
        assert result["next_month_id"] == next_month.id

        # Verify expense was cloned
        cloned_expenses = expense_repo.get_all(month_id=next_month.id)
        assert len(cloned_expenses) == 1
        assert cloned_expenses[0].expense_name == "Test Expense"
        assert cloned_expenses[0].cost == 0.0

    def test_clone_to_next_month_year_rollover(self, test_db):
        """Test cloning expenses handles year rollover (December to January)"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo, income_repo)

        # Create December 2024
        december = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(december)
        test_db.commit()
        test_db.refresh(december)

        # Create expense in December
        expense_repo.create(
            {
                "expense_name": "December Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 80.0,
                "month_id": december.id,
            }
        )

        # Clone expenses (should create January 2025)
        result = service.clone_to_next_month(december.id)

        # Verify January 2025 was created
        january = month_repo.get_by_year_month(2025, 1)
        assert january is not None
        assert january.name == "January 2025"
        assert result["next_month_id"] == january.id

        # Verify expense was cloned
        cloned_expenses = expense_repo.get_all(month_id=january.id)
        assert len(cloned_expenses) == 1
        assert cloned_expenses[0].expense_name == "December Expense"

    def test_clone_to_next_month_no_expenses(self, test_db, sample_month):
        """Test cloning when source month has no expenses"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo, income_repo)

        # Clone expenses (no expenses in source month)
        result = service.clone_to_next_month(sample_month.id)

        # Verify result
        assert result["cloned_count"] == 0
        assert result["cloned_income_count"] == 0
        assert "No data to clone" in result["message"] or "Successfully cloned" in result["message"]

        # Verify next month was created
        next_month = month_repo.get_by_year_month(2024, 12)
        assert next_month is not None

    def test_clone_to_next_month_month_not_found(self, test_db):
        """Test cloning when source month doesn't exist"""
        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo)

        with pytest.raises(NotFoundError) as exc_info:
            service.clone_to_next_month(999)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_clone_to_next_month_no_month_repository(self, test_db):
        """Test cloning fails when month repository is not provided"""
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = ExpenseService(expense_repo, None, income_repo)  # No month_repository

        with pytest.raises(ValidationError) as exc_info:
            service.clone_to_next_month(1)
        assert "Month repository is required" in str(exc_info.value)
