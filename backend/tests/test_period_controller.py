"""Tests for controller layer"""

from models import Expense, Period


class TestPeriodController:
    """Tests for period endpoints"""

    def test_get_periods(self, client, test_db, api_headers):
        """Test getting all periods"""
        period = Period(name="Test Period", color="#8b5cf6")
        test_db.add(period)
        test_db.commit()

        response = client.get("/api/v1/periods", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_create_period(self, client, test_db, api_headers):
        """Test creating a period"""
        response = client.post("/api/v1/periods", json={"name": "New Period"}, headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Period"

    def test_create_period_duplicate(self, client, test_db, api_headers):
        """Test creating duplicate period"""
        period = Period(name="Existing Period", color="#8b5cf6")
        test_db.add(period)
        test_db.commit()

        response = client.post(
            "/api/v1/periods", json={"name": "Existing Period"}, headers=api_headers
        )
        assert response.status_code == 400

    def test_update_period(self, client, test_db, api_headers):
        """Test updating a period"""
        period = Period(name="Original Name", color="#8b5cf6")
        test_db.add(period)
        test_db.commit()
        test_db.refresh(period)

        response = client.put(
            f"/api/v1/periods/{period.id}", json={"name": "Updated Name"}, headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_delete_period(self, client, test_db, api_headers):
        """Test deleting a period"""
        period = Period(name="Test Period", color="#8b5cf6")
        test_db.add(period)
        test_db.commit()
        test_db.refresh(period)

        response = client.delete(f"/api/v1/periods/{period.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Period deleted successfully"

    def test_delete_period_with_dependencies(self, client, test_db, api_headers, sample_month):
        """Test deleting period used by expenses"""
        period = Period(name="Used Period", color="#8b5cf6")
        test_db.add(period)
        test_db.commit()
        test_db.refresh(period)

        expense = Expense(
            expense_name="Test Expense",
            period="Used Period",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()

        response = client.delete(f"/api/v1/periods/{period.id}", headers=api_headers)
        assert response.status_code == 400
