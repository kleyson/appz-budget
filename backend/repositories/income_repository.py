"""Income repository for database operations"""

from sqlalchemy.orm import Session

from models import Income


class IncomeRepository:
    """Repository for income database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, income_data: dict, user_name: str | None = None) -> Income:
        """Create a new income"""
        if user_name:
            income_data["created_by"] = user_name
            income_data["updated_by"] = user_name
        income = Income(**income_data)
        self.db.add(income)
        self.db.commit()
        self.db.refresh(income)
        return income

    def get_by_id(self, income_id: int) -> Income | None:
        """Get income by ID"""
        return self.db.query(Income).filter(Income.id == income_id).first()

    def get_all(
        self,
        period: str | None = None,
        income_type_id: int | None = None,
        month_id: int | None = None,
    ) -> list[Income]:
        """Get all incomes, optionally filtered by period, income_type_id, or month"""
        from sqlalchemy.orm import joinedload

        query = self.db.query(Income).options(joinedload(Income.income_type_obj))
        if period:
            query = query.filter(Income.period == period)
        if income_type_id:
            query = query.filter(Income.income_type_id == income_type_id)
        if month_id:
            query = query.filter(Income.month_id == month_id)
        return query.order_by(Income.income_type_id).all()

    def count_by_income_type(self, income_type_id: int) -> int:
        """Count incomes by income type ID"""
        return self.db.query(Income).filter(Income.income_type_id == income_type_id).count()

    def get_by_period(self, period: str | None = None) -> list[Income]:
        """Get incomes by period with income type relationship loaded"""
        from sqlalchemy.orm import joinedload

        query = self.db.query(Income).options(joinedload(Income.income_type_obj))
        if period:
            query = query.filter(Income.period == period)
        return query.all()

    def update(self, income: Income, income_data: dict, user_name: str | None = None) -> Income:
        """Update an income"""
        if user_name:
            income_data["updated_by"] = user_name
        for key, value in income_data.items():
            setattr(income, key, value)
        self.db.commit()
        self.db.refresh(income)
        return income

    def delete(self, income: Income) -> None:
        """Delete an income"""
        self.db.delete(income)
        self.db.commit()
