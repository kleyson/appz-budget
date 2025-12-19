"""Month repository for database operations"""

from datetime import date

from sqlalchemy.orm import Session

from models import Month


class MonthRepository:
    """Repository for month database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, month_data: dict, user_name: str | None = None) -> Month:
        """Create a new month"""
        if user_name:
            month_data["created_by"] = user_name
            month_data["updated_by"] = user_name
        month = Month(**month_data)
        self.db.add(month)
        self.db.commit()
        self.db.refresh(month)
        return month

    def get_by_id(self, month_id: int) -> Month | None:
        """Get month by ID"""
        return self.db.query(Month).filter(Month.id == month_id).first()

    def get_by_year_month(self, year: int, month: int) -> Month | None:
        """Get month by year and month number"""
        return self.db.query(Month).filter(Month.year == year, Month.month == month).first()

    def get_all(self) -> list[Month]:
        """Get all months ordered by year and month"""
        return self.db.query(Month).order_by(Month.year.desc(), Month.month.desc()).all()

    def get_current(self) -> Month | None:
        """Get current month based on today's date"""
        today = date.today()
        return self.get_by_year_month(today.year, today.month)

    def update(self, month: Month, month_data: dict, user_name: str | None = None) -> Month:
        """Update a month"""
        if user_name:
            month_data["updated_by"] = user_name
        for key, value in month_data.items():
            setattr(month, key, value)
        self.db.commit()
        self.db.refresh(month)
        return month

    def delete(self, month: Month) -> None:
        """Delete a month"""
        self.db.delete(month)
        self.db.commit()

    def exists(self, year: int, month: int) -> bool:
        """Check if a month exists"""
        return (
            self.db.query(Month).filter(Month.year == year, Month.month == month).first()
            is not None
        )
