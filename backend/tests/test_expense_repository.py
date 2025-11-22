"""Tests for repository layer"""

from repositories import ExpenseRepository


class TestExpenseRepository:
    """Tests for ExpenseRepository"""

    def test_create_expense(self, test_db, sample_month):
        """Test creating an expense"""
        repo = ExpenseRepository(test_db)
        expense_data = {
            "expense_name": "Test Expense",
            "period": "Fixed/1st Period",
            "category": "Groceries",
            "budget": 100.0,
            "cost": 90.0,
            "notes": "Test notes",
            "month_id": sample_month.id,
        }
        expense = repo.create(expense_data)
        assert expense.id is not None
        assert expense.expense_name == "Test Expense"
        assert expense.budget == 100.0
        assert expense.cost == 90.0

    def test_get_by_id(self, test_db, sample_expense):
        """Test getting expense by ID"""
        repo = ExpenseRepository(test_db)
        found = repo.get_by_id(sample_expense.id)
        assert found is not None
        assert found.id == sample_expense.id
        assert found.expense_name == sample_expense.expense_name

    def test_get_by_id_not_found(self, test_db):
        """Test getting non-existent expense"""
        repo = ExpenseRepository(test_db)
        found = repo.get_by_id(999)
        assert found is None

    def test_get_all(self, test_db, sample_expense):
        """Test getting all expenses"""
        repo = ExpenseRepository(test_db)
        expenses = repo.get_all()
        assert len(expenses) == 1
        assert expenses[0].id == sample_expense.id

    def test_get_all_filtered_by_period(self, test_db, sample_month):
        """Test filtering expenses by period"""
        repo = ExpenseRepository(test_db)
        # Create expenses with different periods
        repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period A",
                "category": "Category 1",
                "budget": 10.0,
                "cost": 10.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period B",
                "category": "Category 1",
                "budget": 20.0,
                "cost": 20.0,
                "month_id": sample_month.id,
            }
        )
        expenses = repo.get_all(period="Period A")
        assert len(expenses) == 1
        assert expenses[0].period == "Period A"

    def test_get_all_filtered_by_category(self, test_db, sample_month):
        """Test filtering expenses by category"""
        repo = ExpenseRepository(test_db)
        repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category A",
                "budget": 10.0,
                "cost": 10.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category B",
                "budget": 20.0,
                "cost": 20.0,
                "month_id": sample_month.id,
            }
        )
        expenses = repo.get_all(category="Category A")
        assert len(expenses) == 1
        assert expenses[0].category == "Category A"

    def test_update_expense(self, test_db, sample_expense):
        """Test updating an expense"""
        repo = ExpenseRepository(test_db)
        update_data = {"expense_name": "Updated Expense", "cost": 100.0}
        updated = repo.update(sample_expense, update_data)
        assert updated.expense_name == "Updated Expense"
        assert updated.cost == 100.0

    def test_delete_expense(self, test_db, sample_expense):
        """Test deleting an expense"""
        repo = ExpenseRepository(test_db)
        repo.delete(sample_expense)
        found = repo.get_by_id(sample_expense.id)
        assert found is None

    def test_update_category_name(self, test_db, sample_expense):
        """Test updating category name in expenses"""
        repo = ExpenseRepository(test_db)
        repo.update_category_name("Groceries", "Food")
        test_db.refresh(sample_expense)
        assert sample_expense.category == "Food"

    def test_update_period_name(self, test_db, sample_expense):
        """Test updating period name in expenses"""
        repo = ExpenseRepository(test_db)
        repo.update_period_name("Fixed/1st Period", "New Period")
        test_db.refresh(sample_expense)
        assert sample_expense.period == "New Period"

    def test_count_by_category(self, test_db, sample_month):
        """Test counting expenses by category"""
        repo = ExpenseRepository(test_db)
        repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category A",
                "budget": 10.0,
                "cost": 10.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category A",
                "budget": 20.0,
                "cost": 20.0,
                "month_id": sample_month.id,
            }
        )
        count = repo.count_by_category("Category A")
        assert count == 2

    def test_count_by_period(self, test_db, sample_month):
        """Test counting expenses by period"""
        repo = ExpenseRepository(test_db)
        repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period A",
                "category": "Category 1",
                "budget": 10.0,
                "cost": 10.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period A",
                "category": "Category 1",
                "budget": 20.0,
                "cost": 20.0,
                "month_id": sample_month.id,
            }
        )
        count = repo.count_by_period("Period A")
        assert count == 2
