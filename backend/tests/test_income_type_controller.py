"""Tests for controller layer"""

from models import IncomeType


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
