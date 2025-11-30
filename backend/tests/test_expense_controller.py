"""Tests for controller layer"""

from datetime import date

from models import Expense, Income, IncomeType, Month


class TestExpenseController:
    """Tests for expense endpoints"""

    def test_create_expense(self, client, test_db, api_headers, sample_month):
        """Test creating an expense"""
        response = client.post(
            "/api/v1/expenses",
            json={
                "expense_name": "Test Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["expense_name"] == "Test Expense"
        assert data["budget"] == 100.0

    def test_create_expense_no_api_key(self, client, test_db):
        """Test creating expense without API key"""
        response = client.post(
            "/api/v1/expenses",
            json={
                "expense_name": "Test Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
            },
        )
        assert response.status_code == 403

    def test_create_expense_invalid_api_key(self, client, test_db):
        """Test creating expense with invalid API key"""
        response = client.post(
            "/api/v1/expenses",
            json={
                "expense_name": "Test Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
            },
            headers={"X-API-Key": "invalid-key"},
        )
        assert response.status_code == 403

    def test_get_expenses(self, client, test_db, api_headers, sample_month):
        """Test getting all expenses"""
        # Create an expense first
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()

        response = client.get("/api/v1/expenses", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_get_expenses_filtered_by_period(self, client, test_db, api_headers, sample_month):
        """Test filtering expenses by period"""
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period A",
            category="Category 1",
            budget=10.0,
            cost=10.0,
            month_id=sample_month.id,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period B",
            category="Category 1",
            budget=20.0,
            cost=20.0,
            month_id=sample_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        response = client.get("/api/v1/expenses?period=Period A", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["period"] == "Period A"

    def test_get_expense_by_id(self, client, test_db, api_headers, sample_month):
        """Test getting expense by ID"""
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        response = client.get(f"/api/v1/expenses/{expense.id}", headers=api_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == expense.id

    def test_get_expense_not_found(self, client, api_headers):
        """Test getting non-existent expense"""
        response = client.get("/api/v1/expenses/999", headers=api_headers)
        assert response.status_code == 404

    def test_update_expense(self, client, test_db, api_headers, sample_month):
        """Test updating an expense"""
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        response = client.put(
            f"/api/v1/expenses/{expense.id}",
            json={"expense_name": "Updated Expense"},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["expense_name"] == "Updated Expense"

    def test_delete_expense(self, client, test_db, api_headers, sample_month):
        """Test deleting an expense"""
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        response = client.delete(f"/api/v1/expenses/{expense.id}", headers=api_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Expense deleted successfully"

    def test_clone_expenses_to_next_month(self, client, test_db, api_headers, sample_month):
        """Test cloning expenses to next month"""
        # Create expenses in source month
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            notes="Test notes",
            month_id=sample_month.id,
            purchases=[{"name": "Item 1", "amount": 50.0}, {"name": "Item 2", "amount": 40.0}],
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 2",
            category="Category 2",
            budget=200.0,
            cost=150.0,
            month_id=sample_month.id,
        )
        test_db.add_all([expense1, expense2])
        test_db.commit()

        # Create income in source month
        income_type = IncomeType(name="Salary", color="#10b981")
        test_db.add(income_type)
        test_db.commit()
        test_db.refresh(income_type)

        income = Income(
            income_type_id=income_type.id,
            period="Period 1",
            budget=5000.0,
            amount=5200.0,
            month_id=sample_month.id,
        )
        test_db.add(income)
        test_db.commit()

        # Clone expenses and incomes
        response = client.post(
            f"/api/v1/expenses/clone-to-next-month/{sample_month.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cloned_count"] == 2
        assert data["cloned_income_count"] == 1
        assert "Successfully cloned" in data["message"]
        assert "expense(s)" in data["message"]
        assert "income(s)" in data["message"]
        assert "next_month_id" in data
        assert "next_month_name" in data

        # Verify cloned expenses exist
        next_month_id = data["next_month_id"]
        expenses_response = client.get(
            f"/api/v1/expenses?month_id={next_month_id}", headers=api_headers
        )
        assert expenses_response.status_code == 200
        cloned_expenses = expenses_response.json()
        assert len(cloned_expenses) == 2

        # Verify cost and purchases are reset
        for expense in cloned_expenses:
            assert expense["cost"] == 0.0
            assert expense["purchases"] is None

        # Verify other fields are preserved
        exp1 = next((e for e in cloned_expenses if e["expense_name"] == "Expense 1"), None)
        assert exp1 is not None
        assert exp1["period"] == "Period 1"
        assert exp1["category"] == "Category 1"
        assert exp1["budget"] == 100.0
        assert exp1["notes"] == "Test notes"

        # Verify cloned incomes exist
        incomes_response = client.get(
            f"/api/v1/incomes?month_id={next_month_id}", headers=api_headers
        )
        assert incomes_response.status_code == 200
        cloned_incomes = incomes_response.json()
        assert len(cloned_incomes) == 1
        assert cloned_incomes[0]["budget"] == 5000.0
        assert cloned_incomes[0]["amount"] == 0.0  # Amount should be reset

    def test_clone_expenses_to_next_month_creates_month(
        self, client, test_db, api_headers, sample_month
    ):
        """Test cloning expenses creates next month if it doesn't exist"""
        # Create expense in source month
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=50.0,
            cost=45.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()

        # Clone expenses (next month doesn't exist)
        response = client.post(
            f"/api/v1/expenses/clone-to-next-month/{sample_month.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cloned_count"] == 1
        assert data["next_month_name"] == "December 2024"

        # Verify cloned expenses exist in the next month
        next_month_id = data["next_month_id"]
        expenses_response = client.get(
            f"/api/v1/expenses?month_id={next_month_id}", headers=api_headers
        )
        assert expenses_response.status_code == 200
        cloned_expenses = expenses_response.json()
        assert len(cloned_expenses) == 1
        assert cloned_expenses[0]["expense_name"] == "Test Expense"

    def test_clone_expenses_to_next_month_year_rollover(self, client, test_db, api_headers):
        """Test cloning expenses handles year rollover"""

        # Create December 2024
        december = Month(
            year=2024,
            month=12,
            name="December 2024",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 31),
        )
        test_db.add(december)
        test_db.commit()
        test_db.refresh(december)

        # Create expense in December
        expense = Expense(
            expense_name="December Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=80.0,
            month_id=december.id,
        )
        test_db.add(expense)
        test_db.commit()

        # Clone expenses (should create January 2025)
        response = client.post(
            f"/api/v1/expenses/clone-to-next-month/{december.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["next_month_name"] == "January 2025"

        # Verify cloned expenses exist in January 2025
        next_month_id = data["next_month_id"]
        expenses_response = client.get(
            f"/api/v1/expenses?month_id={next_month_id}", headers=api_headers
        )
        assert expenses_response.status_code == 200
        cloned_expenses = expenses_response.json()
        assert len(cloned_expenses) == 1
        assert cloned_expenses[0]["expense_name"] == "December Expense"

    def test_clone_expenses_to_next_month_no_expenses(
        self, client, test_db, api_headers, sample_month
    ):
        """Test cloning when source month has no expenses"""
        response = client.post(
            f"/api/v1/expenses/clone-to-next-month/{sample_month.id}", headers=api_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cloned_count"] == 0
        assert data["cloned_income_count"] == 0
        assert "No data to clone" in data["message"] or "Successfully cloned" in data["message"]

    def test_clone_expenses_to_next_month_month_not_found(self, client, api_headers):
        """Test cloning when source month doesn't exist"""
        response = client.post("/api/v1/expenses/clone-to-next-month/999", headers=api_headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_clone_expenses_to_next_month_no_api_key(self, client, test_db, sample_month):
        """Test cloning without API key"""
        response = client.post(f"/api/v1/expenses/clone-to-next-month/{sample_month.id}")
        assert response.status_code == 403

    def test_reorder_expenses(self, client, test_db, api_headers, sample_month):
        """Test reordering expenses"""
        # Create expenses
        expense1 = Expense(
            expense_name="Expense 1",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
            order=0,
        )
        expense2 = Expense(
            expense_name="Expense 2",
            period="Period 1",
            category="Category 1",
            budget=200.0,
            cost=180.0,
            month_id=sample_month.id,
            order=1,
        )
        expense3 = Expense(
            expense_name="Expense 3",
            period="Period 1",
            category="Category 1",
            budget=300.0,
            cost=270.0,
            month_id=sample_month.id,
            order=2,
        )
        test_db.add_all([expense1, expense2, expense3])
        test_db.commit()
        test_db.refresh(expense1)
        test_db.refresh(expense2)
        test_db.refresh(expense3)

        # Reorder: move expense3 to first position
        response = client.post(
            "/api/v1/expenses/reorder",
            json={"expense_ids": [expense3.id, expense1.id, expense2.id]},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["id"] == expense3.id
        assert data[0]["order"] == 0
        assert data[1]["id"] == expense1.id
        assert data[1]["order"] == 1
        assert data[2]["id"] == expense2.id
        assert data[2]["order"] == 2

        # Verify order persisted
        expenses_response = client.get(
            f"/api/v1/expenses?month_id={sample_month.id}", headers=api_headers
        )
        assert expenses_response.status_code == 200
        expenses = expenses_response.json()
        assert expenses[0]["id"] == expense3.id
        assert expenses[1]["id"] == expense1.id
        assert expenses[2]["id"] == expense2.id

    def test_reorder_expenses_empty_list(self, client, api_headers):
        """Test reordering with empty list"""
        response = client.post(
            "/api/v1/expenses/reorder", json={"expense_ids": []}, headers=api_headers
        )
        assert response.status_code == 400

    def test_reorder_expenses_invalid_id(self, client, api_headers):
        """Test reordering with invalid expense ID"""
        response = client.post(
            "/api/v1/expenses/reorder", json={"expense_ids": [999]}, headers=api_headers
        )
        assert response.status_code == 404

    def test_reorder_expenses_no_api_key(self, client, test_db, sample_month):
        """Test reordering without API key"""
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
            order=0,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        response = client.post("/api/v1/expenses/reorder", json={"expense_ids": [expense.id]})
        assert response.status_code == 403


class TestExpenseClosedMonthController:
    """Tests for expense operations on closed months via API"""

    def test_create_expense_closed_month(self, client, test_db, api_headers, sample_month):
        """Test creating an expense in a closed month via API"""
        # Close the month
        client.post(f"/api/v1/months/{sample_month.id}/close", headers=api_headers)

        # Try to create an expense
        response = client.post(
            "/api/v1/expenses",
            json={
                "expense_name": "Test Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 100.0,
                "cost": 90.0,
                "month_id": sample_month.id,
            },
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "closed" in response.json()["detail"].lower()

    def test_update_expense_closed_month(self, client, test_db, api_headers, sample_month):
        """Test updating an expense in a closed month via API"""
        # Create an expense first
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Close the month
        client.post(f"/api/v1/months/{sample_month.id}/close", headers=api_headers)

        # Try to update the expense
        response = client.put(
            f"/api/v1/expenses/{expense.id}",
            json={"expense_name": "Updated Expense"},
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "closed" in response.json()["detail"].lower()

    def test_delete_expense_closed_month(self, client, test_db, api_headers, sample_month):
        """Test deleting an expense in a closed month via API"""
        # Create an expense first
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Close the month
        client.post(f"/api/v1/months/{sample_month.id}/close", headers=api_headers)

        # Try to delete the expense
        response = client.delete(f"/api/v1/expenses/{expense.id}", headers=api_headers)
        assert response.status_code == 400
        assert "closed" in response.json()["detail"].lower()

    def test_expense_operations_allowed_after_reopening(
        self, client, test_db, api_headers, sample_month
    ):
        """Test expense operations are allowed after reopening month via API"""
        # Create an expense
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=90.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Close the month
        client.post(f"/api/v1/months/{sample_month.id}/close", headers=api_headers)

        # Reopen the month
        client.post(f"/api/v1/months/{sample_month.id}/open", headers=api_headers)

        # Now update should work
        response = client.put(
            f"/api/v1/expenses/{expense.id}",
            json={"expense_name": "Updated Expense"},
            headers=api_headers,
        )
        assert response.status_code == 200
        assert response.json()["expense_name"] == "Updated Expense"

        # Create should work
        response = client.post(
            "/api/v1/expenses",
            json={
                "expense_name": "New Expense",
                "period": "Period 1",
                "category": "Category 1",
                "budget": 50.0,
                "cost": 40.0,
                "month_id": sample_month.id,
            },
            headers=api_headers,
        )
        assert response.status_code == 200

        # Delete should work
        new_expense_id = response.json()["id"]
        response = client.delete(f"/api/v1/expenses/{new_expense_id}", headers=api_headers)
        assert response.status_code == 200


class TestExpensePayController:
    """Tests for expense pay endpoint"""

    def test_pay_expense(self, client, test_db, api_headers, sample_month):
        """Test paying an expense via API"""
        # Create an expense
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Pay the expense
        response = client.post(
            f"/api/v1/expenses/{expense.id}/pay",
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cost"] == 100.0
        assert data["purchases"] is not None
        assert len(data["purchases"]) == 1
        assert data["purchases"][0]["name"] == "Payment"
        assert data["purchases"][0]["amount"] == 100.0

    def test_pay_expense_with_custom_amount(self, client, test_db, api_headers, sample_month):
        """Test paying an expense with a custom amount via API"""
        # Create an expense
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Pay with custom amount
        response = client.post(
            f"/api/v1/expenses/{expense.id}/pay",
            json={"amount": 75.0},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cost"] == 75.0
        assert data["purchases"][0]["amount"] == 75.0

    def test_pay_expense_not_found(self, client, api_headers):
        """Test paying a non-existent expense via API"""
        response = client.post("/api/v1/expenses/999/pay", headers=api_headers)
        assert response.status_code == 404

    def test_pay_expense_no_api_key(self, client, test_db, sample_month):
        """Test paying an expense without API key"""
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        response = client.post(f"/api/v1/expenses/{expense.id}/pay")
        assert response.status_code == 403

    def test_pay_expense_closed_month(self, client, test_db, api_headers, sample_month):
        """Test paying an expense in a closed month via API"""
        # Create an expense
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=0.0,
            month_id=sample_month.id,
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Close the month
        client.post(f"/api/v1/months/{sample_month.id}/close", headers=api_headers)

        # Try to pay the expense
        response = client.post(
            f"/api/v1/expenses/{expense.id}/pay",
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "closed" in response.json()["detail"].lower()

    def test_pay_expense_adds_to_existing_purchases(
        self, client, test_db, api_headers, sample_month
    ):
        """Test paying an expense adds to existing purchases via API"""
        # Create an expense with existing purchases
        expense = Expense(
            expense_name="Test Expense",
            period="Period 1",
            category="Category 1",
            budget=100.0,
            cost=50.0,
            month_id=sample_month.id,
            purchases=[{"name": "Initial purchase", "amount": 50.0}],
        )
        test_db.add(expense)
        test_db.commit()
        test_db.refresh(expense)

        # Pay the expense
        response = client.post(
            f"/api/v1/expenses/{expense.id}/pay",
            json={"amount": 25.0},
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["purchases"]) == 2
        assert data["purchases"][0]["name"] == "Initial purchase"
        assert data["purchases"][1]["name"] == "Payment"
        assert data["cost"] == 75.0
