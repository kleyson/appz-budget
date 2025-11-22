"""Expense repository for database operations"""

from sqlalchemy.orm import Session

from models import Expense


class ExpenseRepository:
    """Repository for expense database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, expense_data: dict, user_name: str | None = None) -> Expense:
        """Create a new expense"""
        if user_name:
            expense_data["created_by"] = user_name
            expense_data["updated_by"] = user_name
        expense = Expense(**expense_data)
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def get_by_id(self, expense_id: int) -> Expense | None:
        """Get expense by ID"""
        return self.db.query(Expense).filter(Expense.id == expense_id).first()

    def get_all(
        self, period: str | None = None, category: str | None = None, month_id: int | None = None
    ) -> list[Expense]:
        """Get all expenses, optionally filtered by period, category, or month"""
        query = self.db.query(Expense)
        if period:
            query = query.filter(Expense.period == period)
        if category:
            query = query.filter(Expense.category == category)
        if month_id:
            query = query.filter(Expense.month_id == month_id)
        return query.order_by(Expense.expense_name).all()

    def update(self, expense: Expense, expense_data: dict, user_name: str | None = None) -> Expense:
        """Update an expense"""
        if user_name:
            expense_data["updated_by"] = user_name
        for key, value in expense_data.items():
            setattr(expense, key, value)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete(self, expense: Expense) -> None:
        """Delete an expense"""
        self.db.delete(expense)
        self.db.commit()

    def get_by_period(self, period: str | None = None) -> list[Expense]:
        """Get expenses filtered by period"""
        query = self.db.query(Expense)
        if period:
            query = query.filter(Expense.period == period)
        return query.all()

    def update_category_name(self, old_name: str, new_name: str) -> None:
        """Update category name in all expenses"""
        self.db.query(Expense).filter(Expense.category == old_name).update(
            {Expense.category: new_name}
        )
        self.db.commit()

    def update_period_name(self, old_name: str, new_name: str) -> None:
        """Update period name in all expenses"""
        self.db.query(Expense).filter(Expense.period == old_name).update({Expense.period: new_name})
        self.db.commit()

    def count_by_category(self, category_name: str) -> int:
        """Count expenses by category"""
        return self.db.query(Expense).filter(Expense.category == category_name).count()

    def count_by_period(self, period_name: str) -> int:
        """Count expenses by period"""
        return self.db.query(Expense).filter(Expense.period == period_name).count()
