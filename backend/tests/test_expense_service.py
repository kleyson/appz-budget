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


class TestExpenseCostCalculation:
    """Tests for expense cost calculation from purchases"""

    def test_create_expense_with_purchases_calculates_cost(self, test_db, sample_month):
        """Test that creating an expense with purchases calculates cost from purchases"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,  # This should be overridden by purchases
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 25.0},
                {"name": "Item 2", "amount": 35.0},
                {"name": "Item 3", "amount": 40.0},
            ],
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 100.0  # 25 + 35 + 40
        assert len(expense.purchases) == 3

    def test_create_expense_with_purchases_ignores_provided_cost(self, test_db, sample_month):
        """Test that provided cost is ignored when purchases exist"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=999.0,  # This should be ignored
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 50.0},
                {"name": "Item 2", "amount": 50.0},
            ],
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 100.0  # 50 + 50, not 999
        assert len(expense.purchases) == 2

    def test_create_expense_without_purchases_uses_provided_cost(self, test_db, sample_month):
        """Test that provided cost is used when no purchases exist"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=75.0,
            month_id=sample_month.id,
            purchases=None,
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 75.0
        assert expense.purchases is None

    def test_create_expense_without_purchases_defaults_cost_to_zero(self, test_db, sample_month):
        """Test that cost defaults to 0 when no purchases and no cost provided"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 0.0
        assert expense.purchases is None

    def test_create_expense_with_empty_purchases_uses_provided_cost(self, test_db, sample_month):
        """Test that empty purchases list is treated as no purchases"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=50.0,
            month_id=sample_month.id,
            purchases=[],
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 50.0
        assert expense.purchases is None  # Empty list converted to None

    def test_create_expense_with_purchases_handles_zero_amounts(self, test_db, sample_month):
        """Test that purchases with zero amounts are handled correctly"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 30.0},
                {"name": "Item 2", "amount": 0.0},  # Zero amount
                {"name": "Item 3", "amount": 20.0},
            ],
        )
        expense = service.create_expense(expense_data)

        assert expense.cost == 50.0  # 30 + 0 + 20
        assert len(expense.purchases) == 3

    def test_update_expense_with_purchases_recalculates_cost(self, test_db, sample_expense):
        """Test that updating purchases recalculates cost"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        update_data = ExpenseUpdate(
            purchases=[
                {"name": "New Item 1", "amount": 60.0},
                {"name": "New Item 2", "amount": 40.0},
            ]
        )
        updated = service.update_expense(sample_expense.id, update_data)

        assert updated.cost == 100.0  # 60 + 40
        assert len(updated.purchases) == 2

    def test_update_expense_add_purchases_recalculates_cost(self, test_db, sample_month):
        """Test that adding purchases to an expense recalculates cost"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        # Create expense without purchases
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=50.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)
        assert expense.cost == 50.0
        assert expense.purchases is None

        # Update to add purchases
        update_data = ExpenseUpdate(
            purchases=[
                {"name": "Item 1", "amount": 30.0},
                {"name": "Item 2", "amount": 45.0},
            ]
        )
        updated = service.update_expense(expense.id, update_data)

        assert updated.cost == 75.0  # 30 + 45
        assert len(updated.purchases) == 2

    def test_update_expense_clear_purchases_keeps_cost(self, test_db, sample_month):
        """Test that clearing purchases keeps existing cost when cost not provided"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        # Create expense with purchases
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 80.0},
            ],
        )
        expense = service.create_expense(expense_data)
        assert expense.cost == 80.0

        # Update to clear purchases (without providing cost)
        update_data = ExpenseUpdate(purchases=[])
        updated = service.update_expense(expense.id, update_data)

        assert updated.purchases is None
        assert updated.cost == 80.0  # Cost kept from before

    def test_update_expense_clear_purchases_with_new_cost(self, test_db, sample_month):
        """Test that clearing purchases with new cost uses new cost"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        # Create expense with purchases
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 80.0},
            ],
        )
        expense = service.create_expense(expense_data)
        assert expense.cost == 80.0

        # Update to clear purchases and set new cost
        update_data = ExpenseUpdate(purchases=None, cost=60.0)
        updated = service.update_expense(expense.id, update_data)

        assert updated.purchases is None
        assert updated.cost == 60.0

    def test_update_expense_modify_purchases_recalculates_cost(self, test_db, sample_month):
        """Test modifying existing purchases recalculates cost"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        # Create expense with purchases
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=200.0,
            cost=0.0,
            month_id=sample_month.id,
            purchases=[
                {"name": "Item 1", "amount": 50.0},
                {"name": "Item 2", "amount": 50.0},
            ],
        )
        expense = service.create_expense(expense_data)
        assert expense.cost == 100.0

        # Update with modified purchases
        update_data = ExpenseUpdate(
            purchases=[
                {"name": "Item 1 Updated", "amount": 75.0},
                {"name": "Item 2 Updated", "amount": 75.0},
                {"name": "Item 3 New", "amount": 50.0},
            ]
        )
        updated = service.update_expense(expense.id, update_data)

        assert updated.cost == 200.0  # 75 + 75 + 50
        assert len(updated.purchases) == 3


class TestExpenseClosedMonthValidation:
    """Tests for expense operations on closed months"""

    def test_create_expense_closed_month(self, test_db, sample_month):
        """Test creating an expense in a closed month"""
        from services import MonthService

        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        expense_service = ExpenseService(expense_repo, month_repo)
        month_service = MonthService(month_repo)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        with pytest.raises(ValidationError) as exc_info:
            expense_service.create_expense(expense_data)
        assert "closed" in str(exc_info.value).lower()

    def test_update_expense_closed_month(self, test_db, sample_month):
        """Test updating an expense in a closed month"""
        from services import MonthService

        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        expense_service = ExpenseService(expense_repo, month_repo)
        month_service = MonthService(month_repo)

        # Create an expense first
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense = expense_service.create_expense(expense_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to update the expense
        update_data = ExpenseUpdate(expense_name="Updated Expense")
        with pytest.raises(ValidationError) as exc_info:
            expense_service.update_expense(expense.id, update_data)
        assert "closed" in str(exc_info.value).lower()

    def test_delete_expense_closed_month(self, test_db, sample_month):
        """Test deleting an expense in a closed month"""
        from services import MonthService

        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        expense_service = ExpenseService(expense_repo, month_repo)
        month_service = MonthService(month_repo)

        # Create an expense first
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense = expense_service.create_expense(expense_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to delete the expense
        with pytest.raises(ValidationError) as exc_info:
            expense_service.delete_expense(expense.id)
        assert "closed" in str(exc_info.value).lower()

    def test_operations_allowed_after_reopening_month(self, test_db, sample_month):
        """Test that expense operations are allowed after reopening a closed month"""
        from services import MonthService

        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        expense_service = ExpenseService(expense_repo, month_repo)
        month_service = MonthService(month_repo)

        # Create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense = expense_service.create_expense(expense_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Reopen the month
        month_service.open_month(sample_month.id)

        # Now operations should work
        update_data = ExpenseUpdate(expense_name="Updated Expense")
        updated_expense = expense_service.update_expense(expense.id, update_data)
        assert updated_expense.expense_name == "Updated Expense"

        # Create another expense
        new_expense_data = ExpenseCreate(
            expense_name="New Expense",
            period="Period 1",
            category="Category 1",
            budget=50.0,
            cost=40.0,
            month_id=sample_month.id,
        )
        new_expense = expense_service.create_expense(new_expense_data)
        assert new_expense.id is not None

        # Delete expense
        result = expense_service.delete_expense(new_expense.id)
        assert result["message"] == "Expense deleted successfully"


class TestExpensePayService:
    """Tests for expense pay functionality"""

    def test_pay_expense_with_budget_amount(self, test_db, sample_month):
        """Test paying an expense with the budget amount"""
        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo)

        # Create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)

        # Pay the expense
        paid_expense = service.pay_expense(expense.id)

        assert paid_expense.cost == 100.0
        assert paid_expense.purchases is not None
        assert len(paid_expense.purchases) == 1
        assert paid_expense.purchases[0]["name"] == "Payment"
        assert paid_expense.purchases[0]["amount"] == 100.0
        assert paid_expense.purchases[0]["date"] is not None

    def test_pay_expense_with_custom_amount(self, test_db, sample_month):
        """Test paying an expense with a custom amount"""
        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo)

        # Create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)

        # Pay the expense with custom amount
        paid_expense = service.pay_expense(expense.id, amount=75.0)

        assert paid_expense.cost == 75.0
        assert paid_expense.purchases is not None
        assert len(paid_expense.purchases) == 1
        assert paid_expense.purchases[0]["name"] == "Payment"
        assert paid_expense.purchases[0]["amount"] == 75.0

    def test_pay_expense_adds_to_existing_purchases(self, test_db, sample_month):
        """Test paying an expense adds to existing purchases"""
        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo)

        # Create an expense with existing purchases
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=50.0,
            month_id=sample_month.id,
            purchases=[{"name": "Initial purchase", "amount": 50.0}],
        )
        expense = service.create_expense(expense_data)

        # Pay the expense
        paid_expense = service.pay_expense(expense.id, amount=25.0)

        assert paid_expense.purchases is not None
        assert len(paid_expense.purchases) == 2
        assert paid_expense.purchases[0]["name"] == "Initial purchase"
        assert paid_expense.purchases[0]["amount"] == 50.0
        assert paid_expense.purchases[1]["name"] == "Payment"
        assert paid_expense.purchases[1]["amount"] == 25.0
        assert paid_expense.cost == 75.0  # Sum of all purchases

    def test_pay_expense_not_found(self, test_db):
        """Test paying a non-existent expense"""
        expense_repo = ExpenseRepository(test_db)
        service = ExpenseService(expense_repo)

        with pytest.raises(NotFoundError):
            service.pay_expense(999)

    def test_pay_expense_closed_month(self, test_db, sample_month):
        """Test paying an expense in a closed month"""
        from services import MonthService

        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        expense_service = ExpenseService(expense_repo, month_repo)
        month_service = MonthService(month_repo)

        # Create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        expense = expense_service.create_expense(expense_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to pay the expense
        with pytest.raises(ValidationError) as exc_info:
            expense_service.pay_expense(expense.id)
        assert "Month" in str(exc_info.value)
        assert "is closed" in str(exc_info.value)

    def test_pay_expense_multiple_payments(self, test_db, sample_month):
        """Test making multiple payments on an expense"""
        expense_repo = ExpenseRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ExpenseService(expense_repo, month_repo)

        # Create an expense
        expense_data = ExpenseCreate(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        expense = service.create_expense(expense_data)

        # Make multiple payments
        service.pay_expense(expense.id, amount=30.0)
        service.pay_expense(expense.id, amount=40.0)
        paid_expense = service.pay_expense(expense.id, amount=30.0)

        assert paid_expense.purchases is not None
        assert len(paid_expense.purchases) == 3
        assert paid_expense.cost == 100.0  # Sum of all payments
