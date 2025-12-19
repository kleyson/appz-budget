# Testing

This directory contains comprehensive tests for the budget management application.

## Test Structure

- `test_repositories.py` - Tests for repository layer (database operations)
- `test_services.py` - Tests for service layer (business logic)
- `test_controllers.py` - Tests for controller layer (HTTP endpoints)
- `conftest.py` - Pytest fixtures and configuration

## Running Tests

### Run all tests
```bash
cd backend
uv run pytest tests/
```

### Run with coverage report
```bash
uv run pytest tests/ --cov=. --cov-report=term-missing
```

### Run with HTML coverage report
```bash
uv run pytest tests/ --cov=. --cov-report=html
# Open htmlcov/index.html in your browser
```

### Run specific test file
```bash
uv run pytest tests/test_repositories.py
```

### Run specific test
```bash
uv run pytest tests/test_services.py::TestExpenseService::test_create_expense
```

## Test Database

Tests use an in-memory SQLite database that is created fresh for each test. This ensures:
- Tests are isolated and don't affect each other
- No need to clean up test data
- Fast test execution
- No dependency on external database setup

## Coverage

Current test coverage: **93%**

The test suite covers:
- ✅ All repository methods (100% coverage)
- ✅ All service methods (100% coverage for most services)
- ✅ All controller endpoints
- ✅ Error handling and edge cases
- ✅ Business logic validation

## Test Fixtures

- `test_db` - In-memory SQLite database session
- `sample_category` - Pre-created category for testing
- `sample_period` - Pre-created period for testing
- `sample_expense` - Pre-created expense for testing

