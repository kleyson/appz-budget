"""Tests for ImportService"""

import io
from calendar import monthrange
from datetime import date

import pandas as pd
import pytest

from exceptions import ValidationError
from repositories import (
    CategoryRepository,
    ExpenseRepository,
    MonthRepository,
    PeriodRepository,
)
from services import ImportService


class TestImportService:
    """Tests for ImportService"""

    def test_import_excel_success(self, test_db, sample_month):
        """Test successful Excel import"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        # Create Excel file in memory
        df = pd.DataFrame(
            {
                "Expense details": ["Milk", "Bread"],
                "Category": ["Groceries", "Groceries"],
                "Period": ["Period 1", "Period 1"],
                "Budget": [50.0, 30.0],
                "Cost": [45.0, 28.0],
                "Notes": ["Weekly", "Daily"],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        result = service.import_excel(excel_bytes.getvalue())
        assert result["imported"] == 2
        assert "Successfully imported" in result["message"]

        # Verify data was imported
        expenses = expense_repo.get_all()
        assert len(expenses) == 2

    def test_import_excel_missing_required_columns(self, test_db):
        """Test import with missing required columns"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        df = pd.DataFrame({"Expense details": ["Milk"], "Budget": [50.0]})
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        with pytest.raises(ValidationError) as exc_info:
            service.import_excel(excel_bytes.getvalue())
        assert "Missing required columns" in str(exc_info.value)

    def test_import_excel_empty_file(self, test_db):
        """Test importing empty Excel file"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        df = pd.DataFrame()
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        with pytest.raises(ValidationError) as exc_info:
            service.import_excel(excel_bytes.getvalue())
        assert "empty" in str(exc_info.value).lower()

    def test_import_excel_invalid_file(self, test_db):
        """Test importing invalid file"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        invalid_bytes = b"not an excel file"

        with pytest.raises(ValidationError):
            service.import_excel(invalid_bytes)

    def test_import_excel_creates_categories_and_periods(self, test_db):
        """Test that import creates categories and periods if they don't exist"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        # Create current month
        today = date.today()
        month_name = today.strftime("%B %Y")
        start_date = date(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        month_repo.create(
            {
                "year": today.year,
                "month": today.month,
                "name": month_name,
                "start_date": start_date,
                "end_date": end_date,
            }
        )
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        df = pd.DataFrame(
            {
                "Expense details": ["Milk"],
                "Category": ["New Category"],
                "Period": ["New Period"],
                "Budget": [50.0],
                "Cost": [45.0],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        service.import_excel(excel_bytes.getvalue())

        # Verify category and period were created
        category = category_repo.get_by_name("New Category")
        period = period_repo.get_by_name("New Period")
        assert category is not None
        assert period is not None

    def test_import_excel_skips_invalid_rows(self, test_db):
        """Test that import skips rows with missing data"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        # Create current month
        today = date.today()
        month_name = today.strftime("%B %Y")
        start_date = date(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        month_repo.create(
            {
                "year": today.year,
                "month": today.month,
                "name": month_name,
                "start_date": start_date,
                "end_date": end_date,
            }
        )
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

        df = pd.DataFrame(
            {
                "Expense details": ["Valid", None, "Valid 2"],
                "Category": ["Cat1", "Cat2", "Cat1"],
                "Budget": [50.0, 30.0, 40.0],
                "Cost": [45.0, 28.0, 35.0],
            }
        )
        excel_bytes = io.BytesIO()
        df.to_excel(excel_bytes, index=False)
        excel_bytes.seek(0)

        result = service.import_excel(excel_bytes.getvalue())
        # Should import 2 valid rows, skip 1 invalid
        assert result["imported"] == 2

    def test_import_excel_with_month_id(self, test_db, sample_month):
        """Test import with specific month_id"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

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

        result = service.import_excel(excel_bytes.getvalue(), month_id=sample_month.id)
        assert result["imported"] == 2

        # Verify expenses were imported to the specified month
        expenses = expense_repo.get_all()
        assert len(expenses) == 2
        assert all(expense.month_id == sample_month.id for expense in expenses)

    def test_import_excel_with_invalid_month_id(self, test_db):
        """Test import with invalid month_id"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

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

        with pytest.raises(ValidationError) as exc_info:
            service.import_excel(excel_bytes.getvalue(), month_id=99999)
        assert "not found" in str(exc_info.value).lower()

    def test_import_excel_without_month_id_uses_current_month(self, test_db):
        """Test that import without month_id uses current month"""
        expense_repo = ExpenseRepository(test_db)
        category_repo = CategoryRepository(test_db)
        period_repo = PeriodRepository(test_db)
        month_repo = MonthRepository(test_db)
        # Create current month
        today = date.today()
        month_name = today.strftime("%B %Y")
        start_date = date(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        current_month = month_repo.create(
            {
                "year": today.year,
                "month": today.month,
                "name": month_name,
                "start_date": start_date,
                "end_date": end_date,
            }
        )
        service = ImportService(expense_repo, category_repo, period_repo, month_repo)

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

        result = service.import_excel(excel_bytes.getvalue())
        assert result["imported"] == 1

        # Verify expense was imported to current month
        expenses = expense_repo.get_all()
        assert len(expenses) == 1
        assert expenses[0].month_id == current_month.id
