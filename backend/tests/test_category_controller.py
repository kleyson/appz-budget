"""Tests for controller layer"""

from models import Category, Expense


class TestCategoryController:
    """Tests for category endpoints"""

    def test_get_categories(self, client, test_db, api_headers):
        """Test getting all categories"""
        category = Category(name="Test Category", color="#8b5cf6")
        test_db.add(category)
        test_db.commit()

        response = client.get("/api/v1/categories", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_create_category(self, client, test_db, api_headers):
        """Test creating a category"""
        response = client.post(
            "/api/v1/categories", json={"name": "New Category"}, headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Category"

    def test_create_category_duplicate(self, client, test_db, api_headers):
        """Test creating duplicate category"""
        category = Category(name="Existing Category", color="#8b5cf6")
        test_db.add(category)
        test_db.commit()

        response = client.post(
            "/api/v1/categories", json={"name": "Existing Category"}, headers=api_headers
        )
        assert response.status_code == 400

    def test_update_category(self, client, test_db, api_headers):
        """Test updating a category"""
        category = Category(name="Original Name", color="#8b5cf6")
        test_db.add(category)
        test_db.commit()
        test_db.refresh(category)

        response = client.put(
            f"/api/v1/categories/{category.id}", json={"name": "Updated Name"}, headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_delete_category(self, client, test_db, api_headers):
        """Test deleting a category"""
        category = Category(name="Test Category", color="#8b5cf6")
        test_db.add(category)
        test_db.commit()
        test_db.refresh(category)

        response = client.delete(f"/api/v1/categories/{category.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Category deleted successfully"

    def test_delete_category_with_dependencies(self, client, test_db, api_headers, sample_month):
        """Test deleting category used by expenses"""
        category = Category(name="Used Category", color="#8b5cf6")
        test_db.add(category)
        test_db.commit()
        test_db.refresh(category)

        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Used Category",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()

        response = client.delete(f"/api/v1/categories/{category.id}", headers=api_headers)
        assert response.status_code == 400

    def test_get_category_summary(self, client, test_db, api_headers, sample_month):
        """Test getting category summary"""
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category A",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 1",
            category="Category A",
            budget=50.0,
            cost=60.0,
            month_id=sample_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        response = client.get("/api/v1/categories/summary", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "Category A"
        assert data[0]["budget"] == 150.0
        assert data[0]["total"] == 150.0

    def test_get_category_summary_filtered_by_month_id(
        self, client, test_db, api_headers, sample_month
    ):
        """Test getting category summary filtered by month_id"""
        from datetime import date

        from models import Month

        # Create another month
        other_month = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(other_month)
        test_db.commit()
        test_db.refresh(other_month)

        # Create expenses in sample_month
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category A",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        # Create expense in other_month
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 1",
            category="Category A",
            budget=50.0,
            cost=60.0,
            month_id=other_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        # Test filtering by sample_month
        response = client.get(
            f"/api/v1/categories/summary?month_id={sample_month.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "Category A"
        assert data[0]["budget"] == 100.0
        assert data[0]["total"] == 90.0
