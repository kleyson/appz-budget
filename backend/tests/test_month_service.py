"""Tests for MonthService"""

from datetime import date

import pytest

from exceptions import ConflictError, NotFoundError, ValidationError
from repositories import MonthRepository
from services import MonthService


class TestMonthService:
    """Tests for MonthService"""

    def test_create_month(self, test_db):
        """Test creating a month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month_data = {"year": 2024, "month": 12}
        month = service.create(month_data)
        assert month["id"] is not None
        assert month["year"] == 2024
        assert month["month"] == 12
        assert month["name"] == "December 2024"

    def test_create_month_invalid_month_number(self, test_db):
        """Test creating month with invalid month number"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month_data = {"year": 2024, "month": 13}
        with pytest.raises(ValidationError) as exc_info:
            service.create(month_data)
        assert "Month must be between 1 and 12" in str(exc_info.value)

    def test_create_month_duplicate(self, test_db, sample_month):
        """Test creating duplicate month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month_data = {"year": 2024, "month": 11}
        with pytest.raises(ConflictError) as exc_info:
            service.create(month_data)
        assert "already exists" in str(exc_info.value)

    def test_get_by_id(self, test_db, sample_month):
        """Test getting month by ID"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month = service.get_by_id(sample_month.id)
        assert month["id"] == sample_month.id
        assert month["year"] == sample_month.year

    def test_get_by_id_not_found(self, test_db):
        """Test getting non-existent month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(NotFoundError) as exc_info:
            service.get_by_id(999)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_get_by_year_month(self, test_db, sample_month):
        """Test getting month by year and month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month = service.get_by_year_month(2024, 11)
        assert month is not None
        assert month["year"] == 2024
        assert month["month"] == 11

    def test_get_by_year_month_not_found(self, test_db):
        """Test getting non-existent month by year and month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month = service.get_by_year_month(2025, 1)
        assert month is None

    def test_get_all(self, test_db):
        """Test getting all months"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        service.create({"year": 2024, "month": 11})
        service.create({"year": 2024, "month": 12})
        months = service.get_all()
        assert len(months) >= 2

    def test_get_current(self, test_db):
        """Test getting current month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        today = date.today()
        # Create current month
        service.create({"year": today.year, "month": today.month})
        current = service.get_current()
        assert current is not None
        assert current["year"] == today.year
        assert current["month"] == today.month

    def test_get_current_returns_most_recent(self, test_db):
        """Test getting current month returns most recent if current doesn't exist"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        # Create a past month
        service.create({"year": 2024, "month": 11})
        current = service.get_current()
        # Should return the most recent month
        assert current is not None
        assert current["year"] == 2024
        assert current["month"] == 11

    def test_get_current_no_months(self, test_db):
        """Test getting current month when no months exist"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        current = service.get_current()
        assert current is None

    def test_update_month(self, test_db, sample_month):
        """Test updating a month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        update_data = {"name": "Updated November 2024"}
        updated = service.update(sample_month.id, update_data)
        assert updated["name"] == "Updated November 2024"

    def test_update_month_year_month(self, test_db, sample_month):
        """Test updating month year and month number"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        update_data = {"year": 2025, "month": 1}
        updated = service.update(sample_month.id, update_data)
        assert updated["year"] == 2025
        assert updated["month"] == 1
        assert updated["name"] == "January 2025"

    def test_update_month_invalid_month_number(self, test_db, sample_month):
        """Test updating month with invalid month number"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        update_data = {"month": 13}
        with pytest.raises(ValidationError) as exc_info:
            service.update(sample_month.id, update_data)
        assert "Month must be between 1 and 12" in str(exc_info.value)

    def test_update_month_duplicate(self, test_db, sample_month):
        """Test updating month to duplicate year/month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        # Create another month
        service.create({"year": 2024, "month": 12})
        # Try to update sample_month to December
        update_data = {"month": 12}
        with pytest.raises(ConflictError) as exc_info:
            service.update(sample_month.id, update_data)
        assert "already exists" in str(exc_info.value)

    def test_update_month_not_found(self, test_db):
        """Test updating non-existent month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        update_data = {"name": "Updated"}
        with pytest.raises(NotFoundError) as exc_info:
            service.update(999, update_data)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_delete_month(self, test_db):
        """Test deleting a month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        month = service.create({"year": 2024, "month": 12})
        service.delete(month["id"])
        with pytest.raises(NotFoundError):
            service.get_by_id(month["id"])

    def test_delete_month_not_found(self, test_db):
        """Test deleting non-existent month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(NotFoundError) as exc_info:
            service.delete(999)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_delete_month_with_expenses(self, test_db, sample_month, sample_expense):
        """Test deleting month with associated expenses - should delete expenses too"""
        from repositories import ExpenseRepository

        repo = MonthRepository(test_db)
        service = MonthService(repo)
        expense_repo = ExpenseRepository(test_db)

        # Verify expense exists before deletion
        assert expense_repo.get_by_id(sample_expense.id) is not None

        # Delete the month (should also delete expenses)
        service.delete(sample_month.id)

        # Verify month is deleted
        with pytest.raises(NotFoundError):
            service.get_by_id(sample_month.id)

        # Verify expense is also deleted
        assert expense_repo.get_by_id(sample_expense.id) is None

    def test_delete_month_with_incomes(self, test_db, sample_month):
        """Test deleting month with associated incomes - should delete incomes too"""
        from models import Income, IncomeType
        from repositories import IncomeRepository

        repo = MonthRepository(test_db)
        service = MonthService(repo)
        income_repo = IncomeRepository(test_db)

        # Create an income type and income
        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income = Income(
            income_type_id=income_type.id,
            period="1st Period",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        test_db.add(income)
        test_db.commit()
        test_db.refresh(income)

        # Verify income exists before deletion
        assert income_repo.get_by_id(income.id) is not None

        # Delete the month (should also delete incomes)
        service.delete(sample_month.id)

        # Verify month is deleted
        with pytest.raises(NotFoundError):
            service.get_by_id(sample_month.id)

        # Verify income is also deleted
        assert income_repo.get_by_id(income.id) is None

    def test_delete_month_with_expenses_and_incomes(self, test_db, sample_month, sample_expense):
        """Test deleting month with both expenses and incomes"""
        from models import Income, IncomeType
        from repositories import ExpenseRepository, IncomeRepository

        repo = MonthRepository(test_db)
        service = MonthService(repo)
        expense_repo = ExpenseRepository(test_db)
        income_repo = IncomeRepository(test_db)

        # Create an income type and income
        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income = Income(
            income_type_id=income_type.id,
            period="1st Period",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        test_db.add(income)
        test_db.commit()
        test_db.refresh(income)

        # Verify both exist before deletion
        assert expense_repo.get_by_id(sample_expense.id) is not None
        assert income_repo.get_by_id(income.id) is not None

        # Delete the month (should delete both expenses and incomes)
        service.delete(sample_month.id)

        # Verify month is deleted
        with pytest.raises(NotFoundError):
            service.get_by_id(sample_month.id)

        # Verify both expense and income are deleted
        assert expense_repo.get_by_id(sample_expense.id) is None
        assert income_repo.get_by_id(income.id) is None


class TestMonthCloseOpen:
    """Tests for month close/open functionality"""

    def test_close_month(self, test_db, sample_month):
        """Test closing a month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        result = service.close_month(sample_month.id, "test_user")
        assert result["is_closed"] is True
        assert result["closed_at"] is not None
        assert result["closed_by"] == "test_user"
        assert "has been closed" in result["message"]

    def test_close_month_already_closed(self, test_db, sample_month):
        """Test closing an already closed month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        # Close the month first
        service.close_month(sample_month.id)
        # Try to close again
        with pytest.raises(ValidationError) as exc_info:
            service.close_month(sample_month.id)
        assert "already closed" in str(exc_info.value)

    def test_close_month_not_found(self, test_db):
        """Test closing a non-existent month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(NotFoundError) as exc_info:
            service.close_month(999)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_open_month(self, test_db, sample_month):
        """Test opening a closed month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        # First close the month
        service.close_month(sample_month.id, "test_user")
        # Then open it
        result = service.open_month(sample_month.id, "test_user")
        assert result["is_closed"] is False
        assert result["closed_at"] is None
        assert result["closed_by"] is None
        assert "has been reopened" in result["message"]

    def test_open_month_not_closed(self, test_db, sample_month):
        """Test opening a month that is not closed"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(ValidationError) as exc_info:
            service.open_month(sample_month.id)
        assert "is not closed" in str(exc_info.value)

    def test_open_month_not_found(self, test_db):
        """Test opening a non-existent month"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(NotFoundError) as exc_info:
            service.open_month(999)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_is_month_closed_false(self, test_db, sample_month):
        """Test checking if a month is closed when it's not"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        assert service.is_month_closed(sample_month.id) is False

    def test_is_month_closed_true(self, test_db, sample_month):
        """Test checking if a month is closed when it is"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        service.close_month(sample_month.id)
        assert service.is_month_closed(sample_month.id) is True

    def test_is_month_closed_not_found(self, test_db):
        """Test checking if a non-existent month is closed"""
        repo = MonthRepository(test_db)
        service = MonthService(repo)
        with pytest.raises(NotFoundError) as exc_info:
            service.is_month_closed(999)
        assert "Month with ID 999 not found" in str(exc_info.value)
