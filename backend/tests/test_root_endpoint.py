"""Tests for controller layer"""

from models import IncomeType


class TestRootEndpoint:
    """Tests for root endpoint"""

    def test_root(self, client):
        """Test root endpoint (no auth required)"""
        response = client.get("/")
        assert response.status_code == 200
        # Root endpoint may return HTML (if static files exist) or JSON
        try:
            data = response.json()
            assert data["message"] == "Appz Budget API"
        except Exception:
            # If it's HTML, that's also valid
            assert "text/html" in response.headers.get("content-type", "")


class TestIncomeTypeController:
    """Tests for income type endpoints"""

    def test_get_income_types(self, client, test_db, api_headers, sample_income_type):
        """Test getting all income types"""
        response = client.get("/api/v1/income-types", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Salary"

    def test_create_income_type(self, client, test_db, api_headers):
        """Test creating an income type"""
        response = client.post(
            "/api/v1/income-types",
            json={"name": "Freelance", "color": "#10b981"},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Freelance"
        assert data["color"] == "#10b981"

    def test_create_income_type_duplicate(self, client, test_db, api_headers, sample_income_type):
        """Test creating duplicate income type"""
        response = client.post(
            "/api/v1/income-types",
            json={"name": "Salary", "color": "#10b981"},
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_update_income_type(self, client, test_db, api_headers, sample_income_type):
        """Test updating an income type"""
        response = client.put(
            f"/api/v1/income-types/{sample_income_type.id}",
            json={"name": "Updated Salary", "color": "#10b981"},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Salary"

    def test_update_income_type_not_found(self, client, api_headers):
        """Test updating non-existent income type"""
        response = client.put(
            "/api/v1/income-types/999",
            json={"name": "Updated", "color": "#10b981"},
            headers=api_headers,
        )
        assert response.status_code == 404

    def test_delete_income_type(self, client, test_db, api_headers):
        """Test deleting an income type"""

        income_type = IncomeType(name="Test Income Type", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        response = client.delete(f"/api/v1/income-types/{income_type.id}", headers=api_headers)
        assert response.status_code == 200

    def test_delete_income_type_with_dependencies(
        self, client, test_db, api_headers, sample_income_type, sample_income
    ):
        """Test deleting income type used by incomes"""
        response = client.delete(
            f"/api/v1/income-types/{sample_income_type.id}", headers=api_headers
        )
        assert response.status_code == 400
        assert "used by" in response.json()["detail"].lower()

    def test_get_income_types_no_api_key(self, client, test_db):
        """Test getting income types without API key"""
        response = client.get("/api/v1/income-types")
        assert response.status_code == 403


class TestIncomeController:
    """Tests for income endpoints"""

    def test_create_income(self, client, test_db, api_headers, sample_month, sample_income_type):
        """Test creating an income"""
        response = client.post(
            "/api/v1/incomes",
            json={
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 5000.0
        assert data["income_type_id"] == sample_income_type.id

    def test_create_income_no_api_key(self, client, test_db):
        """Test creating income without API key"""
        response = client.post(
            "/api/v1/incomes",
            json={
                "income_type_id": 1,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": 1,
            },
        )
        assert response.status_code == 403

    def test_get_incomes(
        self, client, test_db, api_headers, sample_month, sample_income_type, sample_income
    ):
        """Test getting all incomes"""
        response = client.get("/api/v1/incomes", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["amount"] == 5000.0

    def test_get_incomes_filtered_by_month(
        self, client, test_db, api_headers, sample_month, sample_income_type, sample_income
    ):
        """Test getting incomes filtered by month"""
        response = client.get(f"/api/v1/incomes?month_id={sample_month.id}", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_incomes_filtered_by_income_type(
        self, client, test_db, api_headers, sample_month, sample_income_type, sample_income
    ):
        """Test getting incomes filtered by income type"""
        response = client.get(
            f"/api/v1/incomes?income_type_id={sample_income_type.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_income(self, client, test_db, api_headers, sample_income):
        """Test getting a specific income"""
        response = client.get(f"/api/v1/incomes/{sample_income.id}", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_income.id
        assert data["amount"] == 5000.0

    def test_get_income_not_found(self, client, api_headers):
        """Test getting non-existent income"""
        response = client.get("/api/v1/incomes/999", headers=api_headers)
        assert response.status_code == 404

    def test_update_income(self, client, test_db, api_headers, sample_income):
        """Test updating an income"""
        response = client.put(
            f"/api/v1/incomes/{sample_income.id}",
            json={"amount": 6000.0},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 6000.0

    def test_update_income_not_found(self, client, api_headers):
        """Test updating non-existent income"""
        response = client.put(
            "/api/v1/incomes/999",
            json={"amount": 6000.0},
            headers=api_headers,
        )
        assert response.status_code == 404

    def test_delete_income(self, client, test_db, api_headers, sample_income):
        """Test deleting an income"""
        response = client.delete(f"/api/v1/incomes/{sample_income.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Income deleted successfully"

    def test_delete_income_not_found(self, client, api_headers):
        """Test deleting non-existent income"""
        response = client.delete("/api/v1/incomes/999", headers=api_headers)
        assert response.status_code == 404

    def test_create_income_invalid_month(self, client, test_db, api_headers, sample_income_type):
        """Test creating income with invalid month_id"""
        response = client.post(
            "/api/v1/incomes",
            json={
                "income_type_id": sample_income_type.id,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": 999,
            },
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_create_income_invalid_income_type(self, client, test_db, api_headers, sample_month):
        """Test creating income with invalid income_type_id"""
        response = client.post(
            "/api/v1/incomes",
            json={
                "income_type_id": 999,
                "period": "Period 1",
                "budget": 5000.0,
                "amount": 5000.0,
                "month_id": sample_month.id,
            },
            headers=api_headers,
        )
        assert response.status_code == 400
