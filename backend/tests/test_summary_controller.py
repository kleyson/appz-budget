"""Tests for summary controller"""

from models import Expense, Income


class TestSummaryController:
    """Tests for summary endpoints"""

    def test_get_summary_totals(
        self, client, test_db, api_headers, sample_month, sample_expense, sample_income
    ):
        """Test getting summary totals"""
        response = client.get("/api/v1/summary/totals", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_budgeted_expenses" in data
        assert "total_current_expenses" in data
        assert "total_budgeted_income" in data
        assert "total_current_income" in data
        assert "total_budgeted" in data
        assert "total_current" in data

    def test_get_summary_totals_calculations(self, client, test_db, api_headers, sample_month):
        """Test summary totals calculations"""
        # Create expenses
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 1",
            category="Category 1",
            budget=50.0,
            cost=60.0,
            month_id=sample_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        # Create incomes
        from models import IncomeType

        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income1 = Income(
            income_type_id=income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income2 = Income(
            income_type_id=income_type.id,
            period="Period 1",
            budget=2000.0,
            amount=1800.0,
            month_id=sample_month.id,
        )
        test_db.add_all([income1, income2])
        test_db.commit()

        response = client.get("/api/v1/summary/totals", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_budgeted_expenses"] == 150.0
        assert data["total_current_expenses"] == 150.0
        assert data["total_budgeted_income"] == 7000.0
        assert data["total_current_income"] == 6800.0
        assert data["total_budgeted"] == 6850.0  # 7000 - 150
        assert data["total_current"] == 6650.0  # 6800 - 150

    def test_get_summary_totals_filtered_by_period(
        self, client, test_db, api_headers, sample_month
    ):
        """Test summary totals filtered by period"""
        # Create expenses with different periods
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period A",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period B",
            category="Category 1",
            budget=50.0,
            cost=60.0,
            month_id=sample_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        # Create incomes with different periods
        from models import IncomeType

        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income1 = Income(
            income_type_id=income_type.id,
            period="Period A",
            budget=5000.0,
            amount=5000.0,
            month_id=sample_month.id,
        )
        income2 = Income(
            income_type_id=income_type.id,
            period="Period B",
            budget=2000.0,
            amount=1800.0,
            month_id=sample_month.id,
        )
        test_db.add_all([income1, income2])
        test_db.commit()

        response = client.get("/api/v1/summary/totals?period=Period A", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_budgeted_expenses"] == 100.0
        assert data["total_current_expenses"] == 90.0
        assert data["total_budgeted_income"] == 5000.0
        assert data["total_current_income"] == 5000.0

    def test_get_summary_totals_filtered_by_month(self, client, test_db, api_headers):
        """Test summary totals filtered by month"""
        from datetime import date

        from models import IncomeType, Month

        # Create two months
        month1 = Month(
            year=2024,
            month=11,
            name="November 2024",
            start_date=date(2024, 11, 1),
            end_date=date(2024, 11, 30),
        )
        month2 = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add_all([month1, month2])
        test_db.commit()
        test_db.refresh(month1)
        test_db.refresh(month2)

        # Create expenses in different months
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=month1.id,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 1",
            category="Category 1",
            budget=50.0,
            cost=60.0,
            month_id=month2.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        # Create incomes in different months
        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income1 = Income(
            income_type_id=income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5000.0,
            month_id=month1.id,
        )
        income2 = Income(
            income_type_id=income_type.id,
            period="Period 1",
            budget=2000.0,
            amount=1800.0,
            month_id=month2.id,
        )
        test_db.add_all([income1, income2])
        test_db.commit()

        response = client.get(f"/api/v1/summary/totals?month_id={month1.id}", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_budgeted_expenses"] == 100.0
        assert data["total_current_expenses"] == 90.0
        assert data["total_budgeted_income"] == 5000.0
        assert data["total_current_income"] == 5000.0

    def test_get_summary_totals_no_api_key(self, client, test_db):
        """Test getting summary totals without API key"""
        response = client.get("/api/v1/summary/totals")
        assert response.status_code == 403
