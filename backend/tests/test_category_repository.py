"""Tests for repository layer"""

from repositories import CategoryRepository


class TestCategoryRepository:
    """Tests for CategoryRepository"""

    def test_create_category(self, test_db):
        """Test creating a category"""
        repo = CategoryRepository(test_db)
        category = repo.create("Test Category")
        assert category.id is not None
        assert category.name == "Test Category"

    def test_get_by_id(self, test_db, sample_category):
        """Test getting category by ID"""
        repo = CategoryRepository(test_db)
        found = repo.get_by_id(sample_category.id)
        assert found is not None
        assert found.id == sample_category.id

    def test_get_by_name(self, test_db, sample_category):
        """Test getting category by name"""
        repo = CategoryRepository(test_db)
        found = repo.get_by_name("Groceries")
        assert found is not None
        assert found.name == "Groceries"

    def test_get_all(self, test_db):
        """Test getting all categories"""
        repo = CategoryRepository(test_db)
        repo.create("Category 1", "#8b5cf6")
        repo.create("Category 2", "#8b5cf6")
        categories = repo.get_all()
        assert len(categories) == 2

    def test_update_category(self, test_db, sample_category):
        """Test updating a category"""
        repo = CategoryRepository(test_db)
        updated = repo.update(sample_category, "Updated Category")
        assert updated.name == "Updated Category"

    def test_delete_category(self, test_db, sample_category):
        """Test deleting a category"""
        repo = CategoryRepository(test_db)
        repo.delete(sample_category)
        found = repo.get_by_id(sample_category.id)
        assert found is None

    def test_exists_by_name(self, test_db, sample_category):
        """Test checking if category exists by name"""
        repo = CategoryRepository(test_db)
        assert repo.exists_by_name("Groceries") is True
        assert repo.exists_by_name("Non-existent") is False

    def test_exists_by_name_excluding_id(self, test_db):
        """Test checking existence excluding specific ID"""
        repo = CategoryRepository(test_db)
        cat1 = repo.create("Category 1", "#8b5cf6")
        cat2 = repo.create("Category 2", "#8b5cf6")
        assert repo.exists_by_name("Category 1", exclude_id=cat1.id) is False
        assert repo.exists_by_name("Category 1", exclude_id=cat2.id) is True
