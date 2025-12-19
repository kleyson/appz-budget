"""Pytest configuration and fixtures"""

import os
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import app
from models import Category, Expense, Income, IncomeType, Month, Period

# Set test API key
TEST_API_KEY = "test-api-key-12345"
os.environ["API_KEY"] = TEST_API_KEY


@pytest.fixture(scope="function")
def test_db():
    """Create a test database in memory"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose(close=True)


@pytest.fixture
def sample_category(test_db):
    """Create a sample category"""
    category = Category(name="Groceries", color="#8b5cf6")
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    return category


@pytest.fixture
def sample_period(test_db):
    """Create a sample period"""
    period = Period(name="Fixed/1st Period", color="#8b5cf6")
    test_db.add(period)
    test_db.commit()
    test_db.refresh(period)
    return period


@pytest.fixture
def sample_month(test_db):
    """Create a sample month"""
    month = Month(
        year=2024,
        month=11,
        name="November 2024",
        start_date=date(2024, 11, 1),
        end_date=date(2024, 11, 30),
    )
    test_db.add(month)
    test_db.commit()
    test_db.refresh(month)
    return month


@pytest.fixture
def sample_expense(test_db, sample_category, sample_period, sample_month):
    """Create a sample expense"""
    expense = Expense(
        expense_name="Milk",
        period=sample_period.name,
        category=sample_category.name,
        budget=50.0,
        cost=45.0,
        notes="Weekly grocery shopping",
        month_id=sample_month.id,
    )
    test_db.add(expense)
    test_db.commit()
    test_db.refresh(expense)
    return expense


@pytest.fixture
def sample_income_type(test_db):
    """Create a sample income type"""
    income_type = IncomeType(name="Salary", color="#10b981")
    test_db.add(income_type)
    test_db.commit()
    test_db.refresh(income_type)
    return income_type


@pytest.fixture
def sample_income(test_db, sample_income_type, sample_period, sample_month):
    """Create a sample income"""
    income = Income(
        income_type_id=sample_income_type.id,
        period=sample_period.name,
        budget=5000.0,
        amount=5000.0,
        month_id=sample_month.id,
    )
    test_db.add(income)
    test_db.commit()
    test_db.refresh(income)
    return income


@pytest.fixture
def api_headers():
    """API key headers for test requests"""
    return {"X-API-Key": TEST_API_KEY, "X-Client-Info": "Web/2.0"}


@pytest.fixture
def client(test_db):
    """Create a test client with test database"""

    def override_get_db():
        try:
            yield test_db
        finally:
            # Don't close the test_db here, it's managed by the test_db fixture
            pass

    from dependencies import get_db

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.clear()
        test_client.close()
