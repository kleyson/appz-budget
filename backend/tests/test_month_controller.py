"""Tests for month controller"""

from datetime import date

from models import Month


class TestMonthController:
    """Tests for month endpoints"""

    def test_create_month(self, client, test_db, api_headers):
        """Test creating a month"""
        response = client.post(
            "/api/v1/months",
            json={"year": 2024, "month": 12},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2024
        assert data["month"] == 12
        assert data["name"] == "December 2024"

    def test_create_month_no_api_key(self, client, test_db):
        """Test creating month without API key"""
        response = client.post(
            "/api/v1/months",
            json={"year": 2024, "month": 12},
        )
        assert response.status_code == 403

    def test_create_month_duplicate(self, client, test_db, api_headers, sample_month):
        """Test creating duplicate month"""
        response = client.post(
            "/api/v1/months",
            json={"year": 2024, "month": 11},
            headers=api_headers,
        )
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_create_month_invalid_month(self, client, test_db, api_headers):
        """Test creating month with invalid month number"""
        response = client.post(
            "/api/v1/months",
            json={"year": 2024, "month": 13},
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_get_months(self, client, test_db, api_headers, sample_month):
        """Test getting all months"""
        response = client.get("/api/v1/months", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(month["id"] == sample_month.id for month in data)

    def test_get_current_month(self, client, test_db, api_headers):
        """Test getting current month"""
        # Create current month
        today = date.today()
        month = Month(
            year=today.year,
            month=today.month,
            name=f"{today.strftime('%B')} {today.year}",
            start_date=date(today.year, today.month, 1),
            end_date=date(today.year, today.month, 28),
        )
        test_db.add(month)
        test_db.commit()

        response = client.get("/api/v1/months/current", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == today.year
        assert data["month"] == today.month

    def test_get_current_month_not_found(self, client, test_db, api_headers):
        """Test getting current month when no months exist"""
        response = client.get("/api/v1/months/current", headers=api_headers)
        assert response.status_code == 404

    def test_get_month_by_id(self, client, test_db, api_headers, sample_month):
        """Test getting month by ID"""
        response = client.get(f"/api/v1/months/{sample_month.id}", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_month.id
        assert data["year"] == sample_month.year

    def test_get_month_not_found(self, client, api_headers):
        """Test getting non-existent month"""
        response = client.get("/api/v1/months/999", headers=api_headers)
        assert response.status_code == 404

    def test_get_month_by_year_month(self, client, test_db, api_headers, sample_month):
        """Test getting month by year and month"""
        response = client.get("/api/v1/months/year/2024/month/11", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2024
        assert data["month"] == 11

    def test_get_month_by_year_month_not_found(self, client, api_headers):
        """Test getting non-existent month by year and month"""
        response = client.get("/api/v1/months/year/2025/month/1", headers=api_headers)
        assert response.status_code == 404

    def test_update_month(self, client, test_db, api_headers, sample_month):
        """Test updating a month"""
        response = client.put(
            f"/api/v1/months/{sample_month.id}",
            json={"name": "Updated November 2024"},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated November 2024"

    def test_update_month_year_month(self, client, test_db, api_headers, sample_month):
        """Test updating month year and month number"""
        response = client.put(
            f"/api/v1/months/{sample_month.id}",
            json={"year": 2025, "month": 1},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2025
        assert data["month"] == 1
        assert data["name"] == "January 2025"

    def test_update_month_not_found(self, client, api_headers):
        """Test updating non-existent month"""
        response = client.put(
            "/api/v1/months/999",
            json={"name": "Updated"},
            headers=api_headers,
        )
        assert response.status_code == 404

    def test_update_month_duplicate(self, client, test_db, api_headers, sample_month):
        """Test updating month to duplicate year/month"""
        # Create another month
        month2 = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(month2)
        test_db.commit()

        # Try to update sample_month to December
        response = client.put(
            f"/api/v1/months/{sample_month.id}",
            json={"month": 12},
            headers=api_headers,
        )
        assert response.status_code == 409

    def test_delete_month(self, client, test_db, api_headers):
        """Test deleting a month"""
        month = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(month)
        test_db.commit()
        test_db.refresh(month)

        response = client.delete(f"/api/v1/months/{month.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Month deleted successfully"

    def test_delete_month_not_found(self, client, api_headers):
        """Test deleting non-existent month"""
        response = client.delete("/api/v1/months/999", headers=api_headers)
        assert response.status_code == 404

    def test_delete_month_with_expenses(
        self, client, test_db, api_headers, sample_month, sample_expense
    ):
        """Test deleting month with associated expenses - should delete expenses too"""
        from repositories import ExpenseRepository

        expense_repo = ExpenseRepository(test_db)

        # Verify expense exists before deletion
        assert expense_repo.get_by_id(sample_expense.id) is not None

        # Delete the month
        response = client.delete(f"/api/v1/months/{sample_month.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Month deleted successfully"

        # Verify expense is also deleted
        assert expense_repo.get_by_id(sample_expense.id) is None

        # Verify month is deleted
        response = client.get(f"/api/v1/months/{sample_month.id}", headers=api_headers)
        assert response.status_code == 404

    def test_delete_month_with_incomes(self, client, test_db, api_headers, sample_month):
        """Test deleting month with associated incomes - should delete incomes too"""
        from models import Income, IncomeType
        from repositories import IncomeRepository

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

        # Delete the month
        response = client.delete(f"/api/v1/months/{sample_month.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Month deleted successfully"

        # Verify income is also deleted
        assert income_repo.get_by_id(income.id) is None

    def test_get_months_no_api_key(self, client, test_db):
        """Test getting months without API key"""
        response = client.get("/api/v1/months")
        assert response.status_code == 403
