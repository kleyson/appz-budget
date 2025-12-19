"""Category service for business logic"""

from exceptions import ConflictError, DependencyError, NotFoundError
from repositories import CategoryRepository, ExpenseRepository
from schemas import CategoryCreate, CategorySummary, CategoryUpdate


class CategoryService:
    """Service for category business logic"""

    def __init__(
        self, category_repository: CategoryRepository, expense_repository: ExpenseRepository
    ):
        self.repository = category_repository
        self.expense_repository = expense_repository

    def get_categories(self) -> list:
        """Get all categories"""
        return self.repository.get_all()

    def create_category(self, category_data: CategoryCreate, user_name: str | None = None):
        """Create a new category"""
        # Business logic: Check if category already exists
        existing = self.repository.get_by_name(category_data.name)
        if existing:
            raise ConflictError("Category already exists")

        return self.repository.create(category_data.name, category_data.color, user_name)

    def update_category(
        self, category_id: int, category_update: CategoryUpdate, user_name: str | None = None
    ):
        """Update a category"""
        category = self.repository.get_by_id(category_id)
        if not category:
            raise NotFoundError("Category not found")

        # Business logic: Check if new name already exists
        if self.repository.exists_by_name(category_update.name, exclude_id=category_id):
            raise ConflictError("Category name already exists")

        # Business logic: Update expenses that use this category
        old_name = category.name
        updated_category = self.repository.update(
            category, category_update.name, category_update.color, user_name
        )
        self.expense_repository.update_category_name(old_name, category_update.name)

        return updated_category

    def delete_category(self, category_id: int):
        """Delete a category"""
        category = self.repository.get_by_id(category_id)
        if not category:
            raise NotFoundError("Category not found")

        # Business logic: Check if category is used in expenses
        expense_count = self.expense_repository.count_by_category(category.name)
        if expense_count > 0:
            raise DependencyError(
                f"Cannot delete category: it is used by {expense_count} expense(s)",
                count=expense_count,
            )

        self.repository.delete(category)
        return {"message": "Category deleted successfully"}

    def get_category_summary(self, month_id: int | None = None) -> list[CategorySummary]:
        """Get category summary with budget totals and actual costs"""
        # Filter by month_id if provided, otherwise get all expenses
        if month_id is not None:
            expenses = self.expense_repository.get_all(month_id=month_id)
        else:
            expenses = self.expense_repository.get_all()

        # Business logic: Group by category and calculate totals
        category_data = {}
        for expense in expenses:
            if expense.category not in category_data:
                category_data[expense.category] = {
                    "category": expense.category,
                    "budget": 0.0,
                    "total": 0.0,
                }
            category_data[expense.category]["budget"] += expense.budget or 0.0
            category_data[expense.category]["total"] += expense.cost or 0.0

        # Convert to list and calculate over_budget
        summaries = []
        for cat_data in category_data.values():
            summaries.append(
                CategorySummary(
                    category=cat_data["category"],
                    budget=cat_data["budget"],
                    total=cat_data["total"],
                    over_budget=cat_data["total"] > cat_data["budget"],
                )
            )

        return sorted(summaries, key=lambda x: x.category)
