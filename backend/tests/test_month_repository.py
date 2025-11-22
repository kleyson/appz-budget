"""Tests for MonthRepository"""

from datetime import date

from repositories import MonthRepository


class TestMonthRepository:
    """Tests for MonthRepository"""

    def test_create_month(self, test_db):
        """Test creating a month"""
        repo = MonthRepository(test_db)
        month_data = {
            "year": 2024,
            "month": 11,
            "name": "November 2024",
            "start_date": date(2024, 11, 1),
            "end_date": date(2024, 11, 30),
        }
        month = repo.create(month_data)
        assert month.id is not None
        assert month.year == 2024
        assert month.month == 11
        assert month.name == "November 2024"

    def test_get_by_id(self, test_db, sample_month):
        """Test getting month by ID"""
        repo = MonthRepository(test_db)
        found = repo.get_by_id(sample_month.id)
        assert found is not None
        assert found.id == sample_month.id
        assert found.name == sample_month.name

    def test_get_by_id_not_found(self, test_db):
        """Test getting non-existent month"""
        repo = MonthRepository(test_db)
        found = repo.get_by_id(999)
        assert found is None

    def test_get_by_year_month(self, test_db, sample_month):
        """Test getting month by year and month"""
        repo = MonthRepository(test_db)
        found = repo.get_by_year_month(2024, 11)
        assert found is not None
        assert found.year == 2024
        assert found.month == 11

    def test_get_by_year_month_not_found(self, test_db):
        """Test getting non-existent month by year and month"""
        repo = MonthRepository(test_db)
        found = repo.get_by_year_month(2025, 1)
        assert found is None

    def test_get_all(self, test_db):
        """Test getting all months"""
        repo = MonthRepository(test_db)
        repo.create(
            {
                "year": 2024,
                "month": 11,
                "name": "November 2024",
                "start_date": date(2024, 11, 1),
                "end_date": date(2024, 11, 30),
            }
        )
        repo.create(
            {
                "year": 2024,
                "month": 12,
                "name": "December 2024",
                "start_date": date(2024, 12, 1),
                "end_date": date(2024, 12, 31),
            }
        )
        months = repo.get_all()
        assert len(months) >= 2
        # Should be ordered by year desc, month desc
        assert months[0].year >= months[1].year
        if months[0].year == months[1].year:
            assert months[0].month >= months[1].month

    def test_get_current(self, test_db):
        """Test getting current month"""
        repo = MonthRepository(test_db)
        today = date.today()
        # Create current month
        repo.create(
            {
                "year": today.year,
                "month": today.month,
                "name": f"{today.strftime('%B')} {today.year}",
                "start_date": date(today.year, today.month, 1),
                "end_date": date(today.year, today.month, 28),  # Approximate
            }
        )
        current = repo.get_current()
        assert current is not None
        assert current.year == today.year
        assert current.month == today.month

    def test_get_current_not_found(self, test_db):
        """Test getting current month when it doesn't exist"""
        repo = MonthRepository(test_db)
        # Don't create current month
        current = repo.get_current()
        assert current is None

    def test_update_month(self, test_db, sample_month):
        """Test updating a month"""
        repo = MonthRepository(test_db)
        update_data = {"name": "Updated November 2024"}
        updated = repo.update(sample_month, update_data)
        assert updated.name == "Updated November 2024"

    def test_delete_month(self, test_db, sample_month):
        """Test deleting a month"""
        repo = MonthRepository(test_db)
        repo.delete(sample_month)
        found = repo.get_by_id(sample_month.id)
        assert found is None

    def test_exists(self, test_db, sample_month):
        """Test checking if month exists"""
        repo = MonthRepository(test_db)
        assert repo.exists(2024, 11) is True
        assert repo.exists(2025, 1) is False
