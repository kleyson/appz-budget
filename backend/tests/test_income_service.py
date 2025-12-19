"""Tests for IncomeService"""

import pytest

from exceptions import NotFoundError, ValidationError
from repositories import IncomeRepository, IncomeTypeRepository, MonthRepository
from schemas import IncomeCreate, IncomeUpdate
from services import IncomeService


class TestIncomeService:
    """Tests for IncomeService"""

    def test_create_income(self, test_db, sample_month, sample_income_type):
        """Test creating an income"""
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        service = IncomeService(income_repo, month_repo, income_type_repo)
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income = service.create_income(income_data)
        assert income.id is not None
        assert income.amount == 5000.0

    def test_get_income(self, test_db, sample_income):
        """Test getting an income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        income = service.get_income(sample_income.id)
        assert income.id == sample_income.id

    def test_get_income_not_found(self, test_db):
        """Test getting non-existent income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        with pytest.raises(NotFoundError):
            service.get_income(999)

    def test_get_incomes(self, test_db, sample_month, sample_income_type):
        """Test getting all incomes"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        income_repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        incomes = service.get_incomes()
        assert len(incomes) == 1

    def test_get_incomes_filtered_by_income_type(self, test_db, sample_month, sample_income_type):
        """Test getting incomes filtered by income type"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        income_type_repo = IncomeTypeRepository(test_db)
        income_type2 = income_type_repo.create("Freelance", "#10b981")

        income_repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        income_repo.create(
            {
                "income_type_id": income_type2.id,
                "period": "Period 1",
                "budget": 2000.0,
                "amount": 2000.0,
                "month_id": sample_month.id,
            }
        )

        incomes = service.get_incomes(income_type_id=sample_income_type.id)
        assert len(incomes) == 1
        assert incomes[0].amount == 5000.0

    def test_update_income(self, test_db, sample_income):
        """Test updating an income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        update_data = IncomeUpdate(amount=6000.0)
        updated = service.update_income(sample_income.id, update_data)
        assert updated.amount == 6000.0

    def test_update_income_not_found(self, test_db):
        """Test updating non-existent income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        update_data = IncomeUpdate(amount=6000.0)
        with pytest.raises(NotFoundError):
            service.update_income(999, update_data)

    def test_delete_income(self, test_db, sample_income):
        """Test deleting an income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        service.delete_income(sample_income.id)
        assert income_repo.get_by_id(sample_income.id) is None

    def test_delete_income_not_found(self, test_db):
        """Test deleting non-existent income"""
        income_repo = IncomeRepository(test_db)
        service = IncomeService(income_repo)
        with pytest.raises(NotFoundError):
            service.delete_income(999)

    def test_create_income_invalid_month(self, test_db, sample_income_type):
        """Test creating income with invalid month_id"""
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        service = IncomeService(income_repo, month_repo, income_type_repo)
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=999,
        )
        with pytest.raises(ValidationError) as exc_info:
            service.create_income(income_data)
        assert "Month with ID 999 not found" in str(exc_info.value)

    def test_create_income_invalid_income_type(self, test_db, sample_month):
        """Test creating income with invalid income_type_id"""
        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        service = IncomeService(income_repo, month_repo, income_type_repo)
        income_data = IncomeCreate(
            income_type_id=999,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        with pytest.raises(ValidationError) as exc_info:
            service.create_income(income_data)
        assert "Income type with ID 999 not found" in str(exc_info.value)


class TestIncomeClosedMonthValidation:
    """Tests for income operations on closed months"""

    def test_create_income_closed_month(self, test_db, sample_month, sample_income_type):
        """Test creating an income in a closed month"""
        from services import MonthService

        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        income_service = IncomeService(income_repo, month_repo, income_type_repo)
        month_service = MonthService(month_repo)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to create an income
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        with pytest.raises(ValidationError) as exc_info:
            income_service.create_income(income_data)
        assert "closed" in str(exc_info.value).lower()

    def test_update_income_closed_month(self, test_db, sample_month, sample_income_type):
        """Test updating an income in a closed month"""
        from services import MonthService

        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        income_service = IncomeService(income_repo, month_repo, income_type_repo)
        month_service = MonthService(month_repo)

        # Create an income first
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income = income_service.create_income(income_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to update the income
        update_data = IncomeUpdate(amount=6000.0)
        with pytest.raises(ValidationError) as exc_info:
            income_service.update_income(income.id, update_data)
        assert "closed" in str(exc_info.value).lower()

    def test_delete_income_closed_month(self, test_db, sample_month, sample_income_type):
        """Test deleting an income in a closed month"""
        from services import MonthService

        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        income_service = IncomeService(income_repo, month_repo, income_type_repo)
        month_service = MonthService(month_repo)

        # Create an income first
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income = income_service.create_income(income_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Try to delete the income
        with pytest.raises(ValidationError) as exc_info:
            income_service.delete_income(income.id)
        assert "closed" in str(exc_info.value).lower()

    def test_income_operations_allowed_after_reopening_month(
        self, test_db, sample_month, sample_income_type
    ):
        """Test that income operations are allowed after reopening a closed month"""
        from services import MonthService

        income_repo = IncomeRepository(test_db)
        month_repo = MonthRepository(test_db)
        income_type_repo = IncomeTypeRepository(test_db)
        income_service = IncomeService(income_repo, month_repo, income_type_repo)
        month_service = MonthService(month_repo)

        # Create an income
        income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income = income_service.create_income(income_data)

        # Close the month
        month_service.close_month(sample_month.id)

        # Reopen the month
        month_service.open_month(sample_month.id)

        # Now operations should work
        update_data = IncomeUpdate(amount=6000.0)
        updated_income = income_service.update_income(income.id, update_data)
        assert updated_income.amount == 6000.0

        # Create another income
        new_income_data = IncomeCreate(
            income_type_id=sample_income_type.id,
            period="Period 2",
            budget=3000.0,
            amount=3000.0,
            month_id=sample_month.id,
        )
        new_income = income_service.create_income(new_income_data)
        assert new_income.id is not None

        # Delete income
        income_service.delete_income(new_income.id)
        assert income_repo.get_by_id(new_income.id) is None
