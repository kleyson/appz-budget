"""Tests for IncomeRepository"""

from repositories import IncomeRepository


class TestIncomeRepository:
    """Tests for IncomeRepository"""

    def test_create_income(self, test_db, sample_month, sample_income_type):
        """Test creating an income"""
        repo = IncomeRepository(test_db)
        income_data = {
            "income_type_id": sample_income_type.id,
            "period": "Period 1",
            "budget": 5000.0,
            "amount": 5000.0,
            "month_id": sample_month.id,
        }
        income = repo.create(income_data)
        assert income.id is not None
        assert income.amount == 5000.0
        assert income.budget == 5000.0

    def test_get_by_id(self, test_db, sample_income):
        """Test getting income by ID"""
        repo = IncomeRepository(test_db)
        found = repo.get_by_id(sample_income.id)
        assert found is not None
        assert found.id == sample_income.id
        assert found.amount == sample_income.amount

    def test_get_by_id_not_found(self, test_db):
        """Test getting non-existent income"""
        repo = IncomeRepository(test_db)
        found = repo.get_by_id(999)
        assert found is None

    def test_get_all(self, test_db, sample_income):
        """Test getting all incomes"""
        repo = IncomeRepository(test_db)
        incomes = repo.get_all()
        assert len(incomes) == 1
        assert incomes[0].id == sample_income.id

    def test_get_all_filtered_by_period(self, test_db, sample_month, sample_income_type):
        """Test filtering incomes by period"""
        repo = IncomeRepository(test_db)
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period A",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period B",
                "budget": 3000.0,
                "amount": 3000.0,
                "month_id": sample_month.id,
            }
        )
        incomes = repo.get_all(period="Period A")
        assert len(incomes) == 1
        assert incomes[0].period == "Period A"

    def test_get_all_filtered_by_income_type(self, test_db, sample_month, sample_income_type):
        """Test filtering incomes by income type"""
        repo = IncomeRepository(test_db)
        from repositories import IncomeTypeRepository

        income_type2 = IncomeTypeRepository(test_db).create("Freelance", "#10b981")

        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "income_type_id": income_type2.id,
                "period": "Period 1",
                "budget": 2000.0,
                "amount": 2000.0,
                "month_id": sample_month.id,
            }
        )
        incomes = repo.get_all(income_type_id=sample_income_type.id)
        assert len(incomes) == 1
        assert incomes[0].income_type_id == sample_income_type.id

    def test_get_all_filtered_by_month(self, test_db, sample_income_type):
        """Test filtering incomes by month"""
        from datetime import date

        from models import Month

        repo = IncomeRepository(test_db)
        month1 = Month(
            year=2024,
            month=11,
            name="November 2024",
            start_date=date(2024, 11, 1),
            end_date=date(2024, 11, 30),
        )
        test_db.add(month1)
        test_db.commit()
        test_db.refresh(month1)

        month2 = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(month2)
        test_db.commit()
        test_db.refresh(month2)

        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": month1.id,
            }
        )
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 3000.0,
                "amount": 3000.0,
                "month_id": month2.id,
            }
        )
        incomes = repo.get_all(month_id=month1.id)
        assert len(incomes) == 1
        assert incomes[0].month_id == month1.id

    def test_update_income(self, test_db, sample_income):
        """Test updating an income"""
        repo = IncomeRepository(test_db)
        update_data = {"amount": 6000.0}
        updated = repo.update(sample_income, update_data)
        assert updated.amount == 6000.0

    def test_delete_income(self, test_db, sample_income):
        """Test deleting an income"""
        repo = IncomeRepository(test_db)
        repo.delete(sample_income)
        found = repo.get_by_id(sample_income.id)
        assert found is None

    def test_count_by_income_type(self, test_db, sample_month, sample_income_type):
        """Test counting incomes by income type"""
        repo = IncomeRepository(test_db)
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period 2",
                "budget": 3000.0,
                "amount": 3000.0,
                "month_id": sample_month.id,
            }
        )
        count = repo.count_by_income_type(sample_income_type.id)
        # Count should include sample_income fixture + 2 created above
        assert count >= 2  # At least the 2 we created
        assert count <= 3  # sample_income might or might not be in same month

    def test_get_by_period(self, test_db, sample_month, sample_income_type):
        """Test getting incomes by period"""
        repo = IncomeRepository(test_db)
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period A",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            }
        )
        repo.create(
            {
                "income_type_id": sample_income_type.id,
                "period": "Period B",
                "budget": 3000.0,
                "amount": 3000.0,
                "month_id": sample_month.id,
            }
        )
        incomes = repo.get_by_period("Period A")
        assert len(incomes) == 1
        assert incomes[0].period == "Period A"
