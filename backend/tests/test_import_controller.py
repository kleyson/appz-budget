"""Tests for controller layer"""


class TestImportController:
    """Tests for import endpoints"""

    def test_import_excel_success(self, client, test_db, api_headers):
        """Test successful Excel import"""
        import io

        import pandas as pd

        df = pd.DataFrame(
            {
                "Expense details": ["Milk", "Bread"],
                "Category": ["Groceries", "Groceries"],
                "Period": ["Period 1", "Period 1"],
                "Budget": [50.0, 30.0],
                "Cost": [45.0, 28.0],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        response = client.post(
            "/api/v1/import/excel",
            files={
                "file": (
                    "test.xlsx",
                    excel_bytes.getvalue(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["imported"] == 2

    def test_import_excel_missing_columns(self, client, test_db, api_headers):
        """Test import with missing required columns"""
        import io

        import pandas as pd

        df = pd.DataFrame({"Expense details": ["Milk"], "Budget": [50.0]})
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        response = client.post(
            "/api/v1/import/excel",
            files={
                "file": (
                    "test.xlsx",
                    excel_bytes.getvalue(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_import_excel_invalid_file(self, client, api_headers):
        """Test importing invalid file"""
        invalid_bytes = b"not an excel file"
        response = client.post(
            "/api/v1/import/excel",
            files={
                "file": (
                    "test.xlsx",
                    invalid_bytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=api_headers,
        )
        assert response.status_code == 400

    def test_import_excel_no_api_key(self, client, test_db):
        """Test import without API key"""
        import io

        import pandas as pd

        df = pd.DataFrame({"Expense details": ["Milk"], "Category": ["Groceries"]})
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        response = client.post(
            "/api/v1/import/excel",
            files={
                "file": (
                    "test.xlsx",
                    excel_bytes.getvalue(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
        )
        assert response.status_code == 403

    def test_import_excel_with_month_id(self, client, test_db, api_headers, sample_month):
        """Test Excel import with specific month_id"""
        import io

        import pandas as pd

        df = pd.DataFrame(
            {
                "Expense details": ["Milk", "Bread"],
                "Category": ["Groceries", "Groceries"],
                "Period": ["Period 1", "Period 1"],
                "Budget": [50.0, 30.0],
                "Cost": [45.0, 28.0],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        response = client.post(
            f"/api/v1/import/excel?month_id={sample_month.id}",
            files={
                "file": (
                    "test.xlsx",
                    excel_bytes.getvalue(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=api_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["imported"] == 2

        # Verify expenses were imported to the specified month
        from repositories import ExpenseRepository

        expense_repo = ExpenseRepository(test_db)
        expenses = expense_repo.get_all()
        assert len(expenses) == 2
        assert all(expense.month_id == sample_month.id for expense in expenses)

    def test_import_excel_with_invalid_month_id(self, client, test_db, api_headers):
        """Test Excel import with invalid month_id"""
        import io

        import pandas as pd

        df = pd.DataFrame(
            {
                "Expense details": ["Milk"],
                "Category": ["Groceries"],
                "Period": ["Period 1"],
                "Budget": [50.0],
                "Cost": [45.0],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        response = client.post(
            "/api/v1/import/excel?month_id=99999",
            files={
                "file": (
                    "test.xlsx",
                    excel_bytes.getvalue(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
            headers=api_headers,
        )
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
