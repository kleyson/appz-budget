"""Tests for repository layer"""

from repositories import PeriodRepository


class TestPeriodRepository:
    """Tests for PeriodRepository"""

    def test_create_period(self, test_db):
        """Test creating a period"""
        repo = PeriodRepository(test_db)
        period = repo.create("Test Period")
        assert period.id is not None
        assert period.name == "Test Period"

    def test_get_by_id(self, test_db, sample_period):
        """Test getting period by ID"""
        repo = PeriodRepository(test_db)
        found = repo.get_by_id(sample_period.id)
        assert found is not None
        assert found.id == sample_period.id

    def test_get_by_name(self, test_db, sample_period):
        """Test getting period by name"""
        repo = PeriodRepository(test_db)
        found = repo.get_by_name("Fixed/1st Period")
        assert found is not None
        assert found.name == "Fixed/1st Period"

    def test_get_all(self, test_db):
        """Test getting all periods"""
        repo = PeriodRepository(test_db)
        repo.create("Period 1", "#8b5cf6")
        repo.create("Period 2", "#8b5cf6")
        periods = repo.get_all()
        assert len(periods) == 2

    def test_update_period(self, test_db, sample_period):
        """Test updating a period"""
        repo = PeriodRepository(test_db)
        updated = repo.update(sample_period, "Updated Period")
        assert updated.name == "Updated Period"

    def test_delete_period(self, test_db, sample_period):
        """Test deleting a period"""
        repo = PeriodRepository(test_db)
        repo.delete(sample_period)
        found = repo.get_by_id(sample_period.id)
        assert found is None

    def test_exists_by_name(self, test_db, sample_period):
        """Test checking if period exists by name"""
        repo = PeriodRepository(test_db)
        assert repo.exists_by_name("Fixed/1st Period") is True
        assert repo.exists_by_name("Non-existent") is False

    def test_exists_by_name_excluding_id(self, test_db):
        """Test checking existence excluding specific ID"""
        repo = PeriodRepository(test_db)
        period1 = repo.create("Period 1", "#8b5cf6")
        period2 = repo.create("Period 2", "#8b5cf6")
        assert repo.exists_by_name("Period 1", exclude_id=period1.id) is False
        assert repo.exists_by_name("Period 1", exclude_id=period2.id) is True
