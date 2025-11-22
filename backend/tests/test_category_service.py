"""Tests for CategoryService"""

import pytest

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import CategoryRepository, ExpenseRepository
from schemas import CategoryCreate, CategoryUpdate
from services import CategoryService


class TestCategoryService:
    """Tests for CategoryService"""

    def test_get_categories(self, test_db, sample_category):
        """Test getting all categories"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        categories = service.get_categories()
        assert len(categories) == 1

    def test_create_category(self, test_db):
        """Test creating a category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        category_data = CategoryCreate(name="New Category")
        category = service.create_category(category_data)
        assert category.name == "New Category"

    def test_create_category_duplicate(self, test_db, sample_category):
        """Test creating duplicate category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        category_data = CategoryCreate(name="Groceries")
        with pytest.raises(ConflictError):
            service.create_category(category_data)

    def test_update_category(self, test_db, sample_category):
        """Test updating a category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        update_data = CategoryUpdate(name="Updated Category")
        updated = service.update_category(sample_category.id, update_data)
        assert updated.name == "Updated Category"

    def test_update_category_not_found(self, test_db):
        """Test updating non-existent category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        update_data = CategoryUpdate(name="Updated")
        with pytest.raises(NotFoundError):
            service.update_category(999, update_data)

    def test_update_category_duplicate_name(self, test_db):
        """Test updating category with duplicate name"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        cat1 = category_repo.create("Category 1", "#8b5cf6")
        category_repo.create("Category 2", "#8b5cf6")
        update_data = CategoryUpdate(name="Category 2")
        with pytest.raises(ConflictError):
            service.update_category(cat1.id, update_data)

    def test_delete_category(self, test_db):
        """Test deleting a category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        category = category_repo.create("Test Category", "#8b5cf6")
        result = service.delete_category(category.id)
        assert result["message"] == "Category deleted successfully"

    def test_delete_category_not_found(self, test_db):
        """Test deleting non-existent category"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        with pytest.raises(NotFoundError):
            service.delete_category(999)

    def test_delete_category_with_dependencies(self, test_db, sample_category, sample_expense):
        """Test deleting category used by expenses"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)
        with pytest.raises(DependencyError) as exc_info:
            service.delete_category(sample_category.id)
        assert "used by" in str(exc_info.value)

    def test_get_category_summary(self, test_db, sample_month):
        """Test getting category summary"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)

        # Create expenses
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category A",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            }
        )
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category A",
                "budget": 50.0,
                "cost": 60.0,
                "month_id": sample_month.id,
            }
        )

        summary = service.get_category_summary()
        assert len(summary) == 1
        assert summary[0].category == "Category A"
        assert summary[0].budget == 150.0
        assert summary[0].total == 150.0
        assert summary[0].over_budget is False  # 150 is not > 150 (exactly on budget)

    def test_get_category_summary_filtered_by_month_id(self, test_db, sample_month):
        """Test getting category summary filtered by month_id"""
        category_repo = CategoryRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = CategoryService(category_repo, expense_repo)

        # Create another month
        from datetime import date

        from models import Month

        other_month = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(other_month)
        test_db.commit()
        test_db.refresh(other_month)

        # Create expenses in sample_month
        expense_repo.create(
            {
                "expense_name": "Expense 1",
                "period": "Period 1",
                "category": "Category A",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            }
        )
        # Create expense in other_month
        expense_repo.create(
            {
                "expense_name": "Expense 2",
                "period": "Period 1",
                "category": "Category A",
                "budget": 50.0,
                "cost": 60.0,
                "month_id": other_month.id,
            }
        )

        # Test filtering by sample_month
        summary = service.get_category_summary(month_id=sample_month.id)
        assert len(summary) == 1
        assert summary[0].category == "Category A"
        assert summary[0].budget == 100.0
        assert summary[0].total == 90.0

        # Test filtering by other_month
        summary_other = service.get_category_summary(month_id=other_month.id)
        assert len(summary_other) == 1
        assert summary_other[0].budget == 50.0
        assert summary_other[0].total == 60.0
