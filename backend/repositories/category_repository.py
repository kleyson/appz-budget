"""Category repository for database operations"""

from sqlalchemy.orm import Session

from models import Category


class CategoryRepository:
    """Repository for category database operations"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str, color: str | None = None, user_name: str | None = None) -> Category:
        """Create a new category"""
        category = Category(name=name, color=color or "#8b5cf6")
        if user_name:
            category.created_by = user_name
            category.updated_by = user_name
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def get_by_id(self, category_id: int) -> Category | None:
        """Get category by ID"""
        return self.db.query(Category).filter(Category.id == category_id).first()

    def get_by_name(self, name: str) -> Category | None:
        """Get category by name"""
        return self.db.query(Category).filter(Category.name == name).first()

    def get_all(self) -> list[Category]:
        """Get all categories"""
        return self.db.query(Category).order_by(Category.name).all()

    def update(
        self, category: Category, name: str, color: str | None = None, user_name: str | None = None
    ) -> Category:
        """Update a category"""
        category.name = name
        if color is not None:
            category.color = color
        if user_name:
            category.updated_by = user_name
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> None:
        """Delete a category"""
        self.db.delete(category)
        self.db.commit()

    def exists_by_name(self, name: str, exclude_id: int | None = None) -> bool:
        """Check if category exists by name"""
        query = self.db.query(Category).filter(Category.name == name)
        if exclude_id:
            query = query.filter(Category.id != exclude_id)
        return query.first() is not None
