"""Import service for Excel import business logic"""

import io
from calendar import monthrange
from datetime import date
from typing import Any

import pandas as pd

from exceptions import ValidationError
from repositories import CategoryRepository, ExpenseRepository, MonthRepository, PeriodRepository


class ImportService:
    """Service for Excel import business logic"""

    def __init__(
        self,
        expense_repository: ExpenseRepository,
        category_repository: CategoryRepository,
        period_repository: PeriodRepository,
        month_repository: MonthRepository,
    ):
        self.expense_repository = expense_repository
        self.category_repository = category_repository
        self.period_repository = period_repository
        self.month_repository = month_repository

    def import_excel(self, file_contents: bytes, month_id: int | None = None) -> dict[str, Any]:
        """Import expenses from Excel file"""
        # Business logic: Read and validate Excel file
        try:
            df = pd.read_excel(io.BytesIO(file_contents), sheet_name=0, header=0)
        except Exception as e:
            raise ValidationError(f"Error reading Excel file: {str(e)}") from None

        if df.empty:
            raise ValidationError("Excel file is empty or has no data")

        # Business logic: Normalize column names
        df.columns = df.columns.str.strip()
        df = self._normalize_columns(df)

        # Business logic: Validate required columns
        required_cols = ["Expense details", "Category"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            available_cols = ", ".join(df.columns.tolist())
            raise ValidationError(
                f"Missing required columns: {', '.join(missing_cols)}. Available columns: {available_cols}"
            )

        # Business logic: Process rows
        imported_count = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                result = self._process_row(row, month_id=month_id)
                if result:
                    imported_count += 1
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
                continue

        if imported_count == 0 and errors:
            raise ValidationError(f"No expenses imported. Errors: {'; '.join(errors[:5])}")

        message = f"Successfully imported {imported_count} expense(s)"
        if errors:
            message += f". {len(errors)} row(s) had errors"

        return {"message": message, "imported": imported_count, "errors": len(errors)}

    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to match expected format"""
        column_mapping = {
            "expense details": "Expense details",
            "expense_details": "Expense details",
            "expense": "Expense details",
            "expense name": "Expense details",
            "name": "Expense details",
            "period": "Period",
            "category": "Category",
            "budget": "Budget",
            "cost": "Cost",
            "actual": "Cost",
            "actual cost": "Cost",
            "notes": "Notes",
            "note": "Notes",
        }

        df_columns_lower = {col.lower(): col for col in df.columns}
        rename_dict = {}

        for col_lower, standard_name in column_mapping.items():
            if col_lower in df_columns_lower:
                original_col = df_columns_lower[col_lower]
                if original_col != standard_name:
                    rename_dict[original_col] = standard_name

        if rename_dict:
            df.rename(columns=rename_dict, inplace=True)

        return df

    def _process_row(self, row: pd.Series, month_id: int | None = None) -> bool:
        """Process a single row from the Excel file"""
        # Extract and validate essential data
        expense_name = row.get("Expense details", "")
        category_name = row.get("Category", "")

        # Handle NaN values
        if pd.isna(expense_name) or pd.isna(category_name):
            return False

        expense_name = str(expense_name).strip()
        category_name = str(category_name).strip()

        if expense_name == "" or category_name == "":
            return False

        # Get period, default to 'Fixed/1st Period' if not provided
        period_value = row.get("Period", "Fixed/1st Period")
        if pd.isna(period_value):
            period_name = "Fixed/1st Period"
        else:
            period_name = str(period_value).strip()

        if period_name == "":
            period_name = "Fixed/1st Period"

        # Business logic: Ensure category exists
        category = self.category_repository.get_by_name(category_name)
        if not category:
            try:
                category = self.category_repository.create(category_name)
            except Exception:
                # Category might already exist from a concurrent insert
                category = self.category_repository.get_by_name(category_name)
                if not category:
                    raise

        # Business logic: Ensure period exists
        period = self.period_repository.get_by_name(period_name)
        if not period:
            try:
                period = self.period_repository.create(period_name)
            except Exception:
                # Period might already exist from a concurrent insert
                period = self.period_repository.get_by_name(period_name)
                if not period:
                    raise

        # Parse budget and cost values
        budget = self._parse_float(row.get("Budget", 0))
        cost = self._parse_float(row.get("Cost", 0))

        # Parse notes
        notes_value = row.get("Notes", "")
        notes = None
        if not pd.isna(notes_value):
            notes_str = str(notes_value).strip()
            notes = notes_str if notes_str else None

        # Business logic: Get or create month
        if month_id:
            # Use provided month_id
            month = self.month_repository.get_by_id(month_id)
            if not month:
                raise ValidationError(f"Month with id {month_id} not found")
        else:
            # Default to current month if not provided
            today = date.today()
            month = self.month_repository.get_by_year_month(today.year, today.month)
            if not month:
                # Create current month if it doesn't exist
                month_name = today.strftime("%B %Y")
                start_date = date(today.year, today.month, 1)
                _, last_day = monthrange(today.year, today.month)
                end_date = date(today.year, today.month, last_day)
                month = self.month_repository.create(
                    {
                        "year": today.year,
                        "month": today.month,
                        "name": month_name,
                        "start_date": start_date,
                        "end_date": end_date,
                    }
                )

        # Create expense
        expense_data = {
            "expense_name": expense_name,
            "period": period_name,
            "category": category_name,
            "budget": budget,
            "cost": cost,
            "notes": notes,
            "month_id": month.id,
        }
        self.expense_repository.create(expense_data)

        return True

    def _parse_float(self, value: Any) -> float:
        """Parse a value to float, defaulting to 0.0 if invalid"""
        if pd.isna(value):
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0
