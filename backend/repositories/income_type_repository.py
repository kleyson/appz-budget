"""Income type repository for database operations"""

from sqlalchemy.orm import Session

from models import IncomeType


class IncomeTypeRepository:
    """Repository for income type database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self, name: str, color: str | None = None, user_name: str | None = None
    ) -> IncomeType:
        """Create a new income type"""
        income_type = IncomeType(name=name, color=color or "#10b981")
        if user_name:
            income_type.created_by = user_name
            income_type.updated_by = user_name
        self.db.add(income_type)
        self.db.commit()
        self.db.refresh(income_type)
        return income_type

    def get_by_id(self, income_type_id: int) -> IncomeType | None:
        """Get income type by ID"""
        return self.db.query(IncomeType).filter(IncomeType.id == income_type_id).first()

    def get_by_name(self, name: str) -> IncomeType | None:
        """Get income type by name"""
        return self.db.query(IncomeType).filter(IncomeType.name == name).first()

    def get_all(self) -> list[IncomeType]:
        """Get all income types"""
        return self.db.query(IncomeType).order_by(IncomeType.name).all()

    def update(
        self,
        income_type: IncomeType,
        name: str,
        color: str | None = None,
        user_name: str | None = None,
    ) -> IncomeType:
        """Update an income type"""
        income_type.name = name
        if color is not None:
            income_type.color = color
        if user_name:
            income_type.updated_by = user_name
        self.db.commit()
        self.db.refresh(income_type)
        return income_type

    def delete(self, income_type: IncomeType) -> None:
        """Delete an income type"""
        self.db.delete(income_type)
        self.db.commit()

    def exists_by_name(self, name: str, exclude_id: int | None = None) -> bool:
        """Check if income type exists by name"""
        query = self.db.query(IncomeType).filter(IncomeType.name == name)
        if exclude_id:
            query = query.filter(IncomeType.id != exclude_id)
        return query.first() is not None
