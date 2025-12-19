"""Period repository for database operations"""

from sqlalchemy.orm import Session

from models import Period


class PeriodRepository:
    """Repository for period database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str, color: str | None = None, user_name: str | None = None) -> Period:
        """Create a new period"""
        period = Period(name=name, color=color or "#8b5cf6")
        if user_name:
            period.created_by = user_name
            period.updated_by = user_name
        self.db.add(period)
        self.db.commit()
        self.db.refresh(period)
        return period

    def get_by_id(self, period_id: int) -> Period | None:
        """Get period by ID"""
        return self.db.query(Period).filter(Period.id == period_id).first()

    def get_by_name(self, name: str) -> Period | None:
        """Get period by name"""
        return self.db.query(Period).filter(Period.name == name).first()

    def get_all(self) -> list[Period]:
        """Get all periods"""
        return self.db.query(Period).order_by(Period.name).all()

    def update(
        self, period: Period, name: str, color: str | None = None, user_name: str | None = None
    ) -> Period:
        """Update a period"""
        period.name = name
        if color is not None:
            period.color = color
        if user_name:
            period.updated_by = user_name
        self.db.commit()
        self.db.refresh(period)
        return period

    def delete(self, period: Period) -> None:
        """Delete a period"""
        self.db.delete(period)
        self.db.commit()

    def exists_by_name(self, name: str, exclude_id: int | None = None) -> bool:
        """Check if period exists by name"""
        query = self.db.query(Period).filter(Period.name == name)
        if exclude_id:
            query = query.filter(Period.id != exclude_id)
        return query.first() is not None
