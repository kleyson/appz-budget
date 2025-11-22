"""Tests for controller layer"""


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
