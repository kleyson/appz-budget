"""Tests for IncomeTypeRepository"""

from repositories import IncomeTypeRepository


class TestIncomeTypeRepository:
    """Tests for IncomeTypeRepository"""

    def test_create_income_type(self, test_db):
        """Test creating an income type"""
        repo = IncomeTypeRepository(test_db)
        income_type = repo.create("Freelance", "#10b981")
        assert income_type.id is not None
        assert income_type.name == "Freelance"
        assert income_type.color == "#10b981"

    def test_create_income_type_default_color(self, test_db):
        """Test creating income type with default color"""
        repo = IncomeTypeRepository(test_db)
        income_type = repo.create("Salary")
        assert income_type.name == "Salary"
        assert income_type.color == "#10b981"  # Default color

    def test_get_by_id(self, test_db, sample_income_type):
        """Test getting income type by ID"""
        repo = IncomeTypeRepository(test_db)
        found = repo.get_by_id(sample_income_type.id)
        assert found is not None
        assert found.id == sample_income_type.id
        assert found.name == sample_income_type.name

    def test_get_by_id_not_found(self, test_db):
        """Test getting non-existent income type"""
        repo = IncomeTypeRepository(test_db)
        found = repo.get_by_id(999)
        assert found is None

    def test_get_by_name(self, test_db, sample_income_type):
        """Test getting income type by name"""
        repo = IncomeTypeRepository(test_db)
        found = repo.get_by_name("Salary")
        assert found is not None
        assert found.name == "Salary"

    def test_get_by_name_not_found(self, test_db):
        """Test getting non-existent income type by name"""
        repo = IncomeTypeRepository(test_db)
        found = repo.get_by_name("Non-existent")
        assert found is None

    def test_get_all(self, test_db):
        """Test getting all income types"""
        repo = IncomeTypeRepository(test_db)
        repo.create("Income Type 1", "#10b981")
        repo.create("Income Type 2", "#3b82f6")
        income_types = repo.get_all()
        assert len(income_types) >= 2
        # Should be ordered by name
        names = [it.name for it in income_types]
        assert names == sorted(names)

    def test_update_income_type(self, test_db, sample_income_type):
        """Test updating an income type"""
        repo = IncomeTypeRepository(test_db)
        updated = repo.update(sample_income_type, "Updated Salary", "#3b82f6")
        assert updated.name == "Updated Salary"
        assert updated.color == "#3b82f6"

    def test_update_income_type_name_only(self, test_db, sample_income_type):
        """Test updating income type name without changing color"""
        original_color = sample_income_type.color
        repo = IncomeTypeRepository(test_db)
        updated = repo.update(sample_income_type, "Updated Salary")
        assert updated.name == "Updated Salary"
        assert updated.color == original_color

    def test_delete_income_type(self, test_db, sample_income_type):
        """Test deleting an income type"""
        repo = IncomeTypeRepository(test_db)
        repo.delete(sample_income_type)
        found = repo.get_by_id(sample_income_type.id)
        assert found is None

    def test_exists_by_name(self, test_db, sample_income_type):
        """Test checking if income type exists by name"""
        repo = IncomeTypeRepository(test_db)
        assert repo.exists_by_name("Salary") is True
        assert repo.exists_by_name("Non-existent") is False

    def test_exists_by_name_excluding_id(self, test_db):
        """Test checking existence excluding specific ID"""
        repo = IncomeTypeRepository(test_db)
        it1 = repo.create("Income Type 1", "#10b981")
        it2 = repo.create("Income Type 2", "#10b981")
        assert repo.exists_by_name("Income Type 1", exclude_id=it1.id) is False
        assert repo.exists_by_name("Income Type 1", exclude_id=it2.id) is True
