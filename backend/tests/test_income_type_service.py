"""Tests for IncomeTypeService"""

import pytest

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import IncomeRepository, IncomeTypeRepository
from schemas import IncomeTypeCreate, IncomeTypeUpdate
from services import IncomeTypeService


class TestIncomeTypeService:
    """Tests for IncomeTypeService"""

    def test_get_income_types(self, test_db, sample_income_type):
        """Test getting all income types"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        income_types = service.get_income_types()
        assert len(income_types) == 1

    def test_create_income_type(self, test_db):
        """Test creating an income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        income_type_data = IncomeTypeCreate(name="Freelance", color="#10b981")
        income_type = service.create_income_type(income_type_data)
        assert income_type.name == "Freelance"
        assert income_type.color == "#10b981"

    def test_create_income_type_duplicate(self, test_db, sample_income_type):
        """Test creating duplicate income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        income_type_data = IncomeTypeCreate(name="Salary")
        with pytest.raises(ConflictError):
            service.create_income_type(income_type_data)

    def test_update_income_type(self, test_db, sample_income_type):
        """Test updating an income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        update_data = IncomeTypeUpdate(name="Updated Salary", color="#10b981")
        updated = service.update_income_type(sample_income_type.id, update_data)
        assert updated.name == "Updated Salary"

    def test_update_income_type_not_found(self, test_db):
        """Test updating non-existent income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        update_data = IncomeTypeUpdate(name="Updated")
        with pytest.raises(NotFoundError):
            service.update_income_type(999, update_data)

    def test_update_income_type_duplicate_name(self, test_db):
        """Test updating income type with duplicate name"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        it1 = income_type_repo.create("Income Type 1", "#10b981")
        income_type_repo.create("Income Type 2", "#10b981")
        update_data = IncomeTypeUpdate(name="Income Type 2")
        with pytest.raises(ConflictError):
            service.update_income_type(it1.id, update_data)

    def test_delete_income_type(self, test_db):
        """Test deleting an income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        income_type = income_type_repo.create("Test Income Type", "#10b981")
        result = service.delete_income_type(income_type.id)
        assert result["message"] == "Income type deleted successfully"

    def test_delete_income_type_not_found(self, test_db):
        """Test deleting non-existent income type"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        with pytest.raises(NotFoundError):
            service.delete_income_type(999)

    def test_delete_income_type_with_dependencies(self, test_db, sample_income_type, sample_income):
        """Test deleting income type used by incomes"""
        income_type_repo = IncomeTypeRepository(test_db)
        income_repo = IncomeRepository(test_db)
        service = IncomeTypeService(income_type_repo, income_repo)
        with pytest.raises(DependencyError) as exc_info:
            service.delete_income_type(sample_income_type.id)
        assert "used by" in str(exc_info.value)
