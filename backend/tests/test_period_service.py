"""Tests for PeriodService"""

import pytest

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import ExpenseRepository, PeriodRepository
from schemas import PeriodCreate, PeriodUpdate
from services import PeriodService


class TestPeriodService:
    """Tests for PeriodService"""

    def test_get_periods(self, test_db, sample_period):
        """Test getting all periods"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        periods = service.get_periods()
        assert len(periods) == 1

    def test_create_period(self, test_db):
        """Test creating a period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        period_data = PeriodCreate(name="New Period")
        period = service.create_period(period_data)
        assert period.name == "New Period"

    def test_create_period_duplicate(self, test_db, sample_period):
        """Test creating duplicate period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        period_data = PeriodCreate(name="Fixed/1st Period")
        with pytest.raises(ConflictError):
            service.create_period(period_data)

    def test_update_period(self, test_db, sample_period):
        """Test updating a period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        update_data = PeriodUpdate(name="Updated Period")
        updated = service.update_period(sample_period.id, update_data)
        assert updated.name == "Updated Period"

    def test_update_period_not_found(self, test_db):
        """Test updating non-existent period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        update_data = PeriodUpdate(name="Updated")
        with pytest.raises(NotFoundError):
            service.update_period(999, update_data)

    def test_update_period_duplicate_name(self, test_db):
        """Test updating period with duplicate name"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        period1 = period_repo.create("Period 1", "#8b5cf6")
        period_repo.create("Period 2", "#8b5cf6")
        update_data = PeriodUpdate(name="Period 2")
        with pytest.raises(ConflictError):
            service.update_period(period1.id, update_data)

    def test_delete_period(self, test_db):
        """Test deleting a period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        period = period_repo.create("Test Period", "#8b5cf6")
        result = service.delete_period(period.id)
        assert result["message"] == "Period deleted successfully"

    def test_delete_period_not_found(self, test_db):
        """Test deleting non-existent period"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        with pytest.raises(NotFoundError):
            service.delete_period(999)

    def test_delete_period_with_dependencies(self, test_db, sample_period, sample_expense):
        """Test deleting period used by expenses"""
        period_repo = PeriodRepository(test_db)
        expense_repo = ExpenseRepository(test_db)
        service = PeriodService(period_repo, expense_repo)
        with pytest.raises(DependencyError) as exc_info:
            service.delete_period(sample_period.id)
        assert "used by" in str(exc_info.value)
