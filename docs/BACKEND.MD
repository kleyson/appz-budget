# Backend Documentation

## Overview

The backend is built with **Python FastAPI** using SQLAlchemy ORM and SQLite database. It follows a layered architecture with dependency injection.

## Architecture

### Layer Responsibilities

1. **Controllers** (`controllers/`):

   - Handle HTTP requests and responses
   - Validate input using Pydantic schemas
   - Create repositories and services (dependency injection)
   - Convert service exceptions to HTTPException
   - Handle database transactions (commit/rollback)
   - Return appropriate HTTP responses

2. **Services** (`services/`):

   - Contain all business logic
   - Validate business rules (e.g., uniqueness checks, dependency checks)
   - Coordinate between repositories
   - Handle complex operations (e.g., category summary calculations)
   - Raise custom exceptions (NotFoundError, ConflictError, ValidationError, DependencyError)
   - **No knowledge of HTTP or database sessions** - completely framework-agnostic

3. **Repositories** (`repositories/`):

   - Handle all database operations
   - Abstract SQLAlchemy queries
   - Provide clean interface for data access
   - Take Session as dependency
   - No business logic, only CRUD operations

4. **Models** (`models/`):
   - SQLAlchemy ORM models
   - Define database schema
   - Used by repositories for database operations

### Custom Exceptions

Located in `exceptions.py`:

- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate or conflicting data
- `ValidationError` - Invalid input data
- `DependencyError` - Cannot delete due to dependencies

## Tech Stack

### Backend Dependencies

- `fastapi==0.115.0` - Web framework
- `uvicorn[standard]==0.32.0` - ASGI server
- `sqlalchemy==2.0.36` - ORM
- `pydantic>=2.10.0` - Data validation
- `python-multipart==0.0.12` - File upload support
- `openpyxl==3.1.5` - Excel file reading
- `pandas==2.3.3` - Data processing
- `jose` - JWT token handling
- `bcrypt` - Password hashing

### Package Manager

- **uv** - Modern Python package manager (commands run in `backend/` directory)

## Database

### Configuration

- **Location**: `backend/data/budget.db` (SQLite)
- **Connection**: `sqlite:///./data/budget.db`
- **ORM**: SQLAlchemy with declarative base
- **Session Management**: SessionLocal with dependency injection

### Schema

#### `users` table

- `id` (Integer, Primary Key)
- `email` (String, Unique, Not Null, Indexed)
- `hashed_password` (String, Not Null)
- `full_name` (String, Nullable)
- `is_active` (Boolean, Default: True)
- `is_admin` (Boolean, Default: False)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### `expenses` table

- `id` (Integer, Primary Key, Indexed)
- `expense_name` (String, Not Null, Indexed)
- `period` (String, Not Null, Indexed)
- `category` (String, Not Null, Indexed)
- `budget` (Float, Default: 0.0)
- `cost` (Float, Default: 0.0)
- `notes` (Text, Nullable)
- `user_name` (String, Not Null)
- `month_id` (Integer, Foreign Key to months)
- `is_paid` (Boolean, Default: False)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### `categories` table

- `id` (Integer, Primary Key, Indexed)
- `name` (String, Unique, Not Null, Indexed)
- `color` (String, Not Null)
- `user_name` (String, Not Null)

#### `periods` table

- `id` (Integer, Primary Key, Indexed)
- `name` (String, Unique, Not Null, Indexed)
- `color` (String, Not Null)
- `user_name` (String, Not Null)

#### `income_types` table

- `id` (Integer, Primary Key)
- `name` (String, Unique, Not Null)
- `color` (String, Not Null)
- `user_name` (String, Not Null)

#### `incomes` table

- `id` (Integer, Primary Key)
- `income_type` (String, Not Null)
- `amount` (Float, Not Null)
- `month_id` (Integer, Foreign Key)
- `user_name` (String, Not Null)
- `created_at` (DateTime)
- `updated_at` (DateTime)

#### `months` table

- `id` (Integer, Primary Key)
- `year` (Integer, Not Null)
- `month` (Integer, Not Null)
- `is_closed` (Boolean, Default: False)
- `user_name` (String, Not Null)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Migrations

Managed via Alembic:

- Migration files: `backend/alembic/versions/`
- Configuration: `backend/alembic.ini` and `backend/alembic/env.py`

**Commands:**

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Create new migration
uv run alembic revision --autogenerate -m "message"

# Rollback last migration
uv run alembic downgrade -1

# Show current migration version
uv run alembic current
```

## API Authentication

### API Key Authentication

All `/api/*` endpoints require `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:8000/api/expenses
```

The API key is configured via the `API_KEY` environment variable.

### JWT Authentication

For user authentication:

- JWT tokens with 30-day expiration
- Secret key configured via `JWT_SECRET_KEY` environment variable
- Default fallback: `"your-secret-key-change-in-production"` (should be changed in production)

## API Endpoints

### Base URL

- Development: `http://localhost:8000`
- Production: Configure via `FRONTEND_URL` environment variable

### API Documentation

FastAPI automatically generates interactive OpenAPI documentation:

- **Swagger UI**: `http://localhost:8000/docs`

  - Interactive API explorer with "Try it out" functionality
  - Use the "Authorize" button to set your API key for authenticated requests
  - Test endpoints directly from the browser

- **ReDoc**: `http://localhost:8000/redoc`

  - Clean, readable API documentation
  - Alternative documentation format with better readability

- **OpenAPI Schema**: `http://localhost:8000/openapi.json`
  - Machine-readable API specification in JSON format
  - Can be imported into API clients (Postman, Insomnia, etc.)
  - Used for code generation and API testing tools

The documentation is automatically updated when you modify API endpoints, schemas, or routes.

### Health Check

- `GET /` - Health check (no auth required)
- `GET /api/v1/health` - Health check endpoint with version info

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (returns JWT token)
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token/code
- `POST /api/v1/auth/change-password` - Change password (authenticated)
- `GET /api/v1/auth/me` - Get current user info

### Expense Endpoints

- `GET /api/v1/expenses` - Get all expenses (query params: `period`, `category`, `month_id`)
- `POST /api/v1/expenses` - Create new expense
- `GET /api/v1/expenses/{expense_id}` - Get specific expense
- `PUT /api/v1/expenses/{expense_id}` - Update expense
- `DELETE /api/v1/expenses/{expense_id}` - Delete expense
- `POST /api/v1/expenses/reorder` - Reorder expenses by providing list of expense IDs
- `POST /api/v1/expenses/clone-to-next-month/{month_id}` - Clone all expenses and incomes from a month to the following month
- `POST /api/v1/expenses/{expense_id}/pay` - Mark expense as paid (adds payment entry)

### Category Endpoints

- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/{category_id}` - Update category (also updates related expenses)
- `DELETE /api/v1/categories/{category_id}` - Delete category (only if not used)
- `GET /api/v1/categories/summary` - Get category summary with totals (query param: `month_id`)

### Period Endpoints

- `GET /api/v1/periods` - Get all periods
- `POST /api/v1/periods` - Create new period
- `PUT /api/v1/periods/{period_id}` - Update period (also updates related expenses)
- `DELETE /api/v1/periods/{period_id}` - Delete period (only if not used)

### Income Type Endpoints

- `GET /api/v1/income-types` - Get all income types
- `POST /api/v1/income-types` - Create new income type
- `PUT /api/v1/income-types/{income_type_id}` - Update income type
- `DELETE /api/v1/income-types/{income_type_id}` - Delete income type
- `GET /api/v1/income-types/summary` - Get income type summary with totals (query param: `month_id`)

### Income Endpoints

- `GET /api/v1/incomes` - Get all incomes (query param: `month_id`)
- `POST /api/v1/incomes` - Create new income
- `GET /api/v1/incomes/{income_id}` - Get specific income
- `PUT /api/v1/incomes/{income_id}` - Update income
- `DELETE /api/v1/incomes/{income_id}` - Delete income

### Month Endpoints

- `GET /api/v1/months` - Get all months
- `POST /api/v1/months` - Create new month
- `GET /api/v1/months/current` - Get current month
- `GET /api/v1/months/{month_id}` - Get specific month
- `GET /api/v1/months/year/{year}/month/{month}` - Get month by year and month number
- `PUT /api/v1/months/{month_id}` - Update month
- `DELETE /api/v1/months/{month_id}` - Delete month
- `POST /api/v1/months/{month_id}/close` - Close a month
- `POST /api/v1/months/{month_id}/open` - Reopen a closed month

### Summary Endpoints

- `GET /api/v1/summary/totals` - Get summary totals (query params: `period`, `month_id`)
- `GET /api/v1/summary/by-period` - Get period summary (query param: `month_id`)
- `GET /api/v1/summary/monthly-trends` - Get monthly trends data

### Import Endpoint

- `POST /api/v1/import/excel` - Import expenses from Excel file (multipart/form-data, query param: `month_id`)

### Backup Endpoints (Admin Only)

- `GET /api/v1/backups` - List available backups
- `POST /api/v1/backups/create` - Create new backup
- `GET /api/v1/backups/{filename}/download-url` - Get signed download URL for backup
- `GET /api/v1/backups/{filename}/download` - Download backup file directly
- `DELETE /api/v1/backups/{filename}` - Delete backup

### User Management Endpoints (Admin Only)

- `GET /api/v1/auth/users` - List all users
- `POST /api/v1/auth/users` - Create new user
- `GET /api/v1/auth/users/{user_id}` - Get specific user
- `PUT /api/v1/auth/users/{user_id}` - Update user
- `DELETE /api/v1/auth/users/{user_id}` - Delete user
- `GET /api/v1/auth/password-resets` - List active password resets
- `POST /api/v1/auth/users/{user_id}/generate-reset-link` - Generate reset link for user

## Development Setup

### Prerequisites

- Python 3.12+ (or 3.13+)
- uv (Python package manager)
- Virtual environment at project root (`.venv`)

### Installation

```bash
cd backend
uv sync
uv run alembic upgrade head  # Run migrations to create tables
```

### Running

```bash
# Development mode (with hot reload)
ENV=development uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Makefile
make backend

# Production mode
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Runs on `http://localhost:8000`

### Seeding Data

```bash
uv run python seed.py
```

Creates:

- Admin user: `admin@email.com` / `admin` (change immediately!)
- Current month
- Default categories, income types, and periods

## Environment Variables

### Core Configuration

- `API_KEY` - Secret API key for backend authentication (**required**, change the default!)
- `JWT_SECRET_KEY` - JWT token signing key (default: `"your-secret-key-change-in-production"`)
- `DATABASE_URL` - Database connection string (default: `sqlite:///./data/budget.db`)
- `ENV` - Environment mode: `development` or `production` (default: `production`)
- `PORT` - Port to expose (default: `8000`)

### SMTP Email Configuration (Optional)

Configure these to enable password reset emails. If not configured, reset codes will only appear in Docker logs.

- `SMTP_HOST` - SMTP server hostname (e.g., `smtp.gmail.com`)
- `SMTP_PORT` - SMTP server port (default: `587` for TLS)
- `SMTP_USER` - SMTP username (often your email address)
- `SMTP_PASSWORD` - SMTP password or app-specific password
- `SMTP_FROM` - From email address for outgoing emails
- `SMTP_USE_TLS` - Use TLS encryption (default: `true`)

### Password Reset Configuration (Optional)

- `RESET_CODE_LENGTH` - Length of the short reset code (default: `6`)
- `RESET_CODE_EXPIRATION_MINUTES` - Code validity duration (default: `30`)
- `RESET_TOKEN_EXPIRATION_HOURS` - Full token validity duration (default: `24`)
- `FRONTEND_URL` - Frontend URL for password reset links (default: `http://localhost:8000`)

## Testing

### Test Suite

- **Framework**: pytest with pytest-cov for coverage
- **Coverage**: 93% overall coverage
- **Test Database**: In-memory SQLite (isolated per test)

### Running Tests

```bash
# Run all tests
uv run pytest tests/

# Run with coverage
uv run pytest tests/ --cov=. --cov-report=html

# Or using Makefile
make test-backend
```

### Test Structure

- `tests/test_repositories.py` - Repository layer tests
- `tests/test_services.py` - Service layer tests
- `tests/test_controllers.py` - Controller/HTTP endpoint tests
- `tests/conftest.py` - Pytest fixtures and test database setup

## Docker Deployment

### Building

```bash
docker build -t appz-budget:latest --build-arg VITE_API_KEY=your-api-key .
```

### Running with Docker Compose

```bash
# Using pre-built image (recommended)
docker-compose up -d

# Or build from source using Dockerfile directly
docker build -t appz-budget:latest .
docker run -d -p 8000:8000 -e API_KEY=your-secret-api-key appz-budget:latest
```

### Docker Features

- Multi-stage build for optimized image size (~400-500MB)
- Runs as non-root user (`appuser`, UID 1000)
- Automatic database migrations on startup
- Health checks configured
- Daily automated backups (runs at 2 AM)
- Data persistence via Docker volumes

See [DOCKER.md](./DOCKER.md) for detailed Docker documentation.

## Security

### Best Practices

1. **Never commit secrets**:

   - API keys
   - JWT secret keys
   - Database files with real data
   - Environment files with credentials

2. **Use environment variables** for all sensitive configuration

3. **Password hashing**: Uses bcrypt with automatic salt generation

4. **JWT tokens**: 30-day expiration, secure signing

5. **API key protection**: All API endpoints require valid API key

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## File Structure

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # SQLAlchemy database configuration
├── dependencies.py      # Shared dependencies (get_db, get_api_key)
├── exceptions.py        # Custom business logic exceptions
├── schemas.py           # Pydantic schemas for validation
├── seed.py              # Seed script for initial data
├── models/              # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── expense.py
│   ├── category.py
│   ├── period.py
│   ├── income_type.py
│   ├── income.py
│   ├── month.py
│   ├── user.py
│   └── seed.py
├── controllers/         # API controllers (HTTP layer)
│   ├── __init__.py
│   ├── expense_controller.py
│   ├── category_controller.py
│   ├── period_controller.py
│   ├── income_controller.py
│   ├── income_type_controller.py
│   ├── month_controller.py
│   ├── summary_controller.py
│   ├── import_controller.py
│   ├── auth_controller.py
│   ├── backup_controller.py
│   └── health_controller.py
├── services/            # Business logic layer
│   ├── __init__.py
│   ├── expense_service.py
│   ├── category_service.py
│   ├── period_service.py
│   ├── income_service.py
│   ├── income_type_service.py
│   ├── month_service.py
│   ├── summary_service.py
│   ├── import_service.py
│   └── user_service.py
├── repositories/        # Data access layer
│   ├── __init__.py
│   ├── expense_repository.py
│   ├── category_repository.py
│   ├── period_repository.py
│   ├── income_repository.py
│   ├── income_type_repository.py
│   ├── month_repository.py
│   └── user_repository.py
├── utils/              # Utility modules
│   ├── auth.py         # JWT and password hashing
│   ├── config.py       # Configuration (SMTP, password reset)
│   ├── email_sender.py # Email sending functionality
│   └── html_injector.py # Runtime API key injection
├── alembic/            # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini         # Alembic configuration
├── tests/              # Test suite
├── data/               # Data directory (database, backups)
│   └── backups/
├── public/             # Frontend static files (served by FastAPI)
└── pyproject.toml       # Python dependencies (uv)
```

## Key Implementation Details

### Data Flow

1. HTTP Request → Controller
2. Controller → Service (business logic)
3. Service → Repository (data access)
4. Repository → SQLAlchemy → SQLite Database
5. Response flows back through layers

### Category/Period Updates

When updating a category/period name, all related expenses are automatically updated via the service layer. This ensures data consistency.

### Excel Import

Handled by `import_service.py`:

- Required columns: `Expense details`, `Category`
- Optional columns: `Period`, `Budget`, `Cost`, `Notes`
- Auto-creates missing categories/periods
- Handles column name variations
- Skips invalid rows and reports errors

### Password Reset

Two methods:

1. **Short code** (6 digits) - Expires in 30 minutes
2. **Token** (URL-safe) - Expires in 24 hours

Both methods work, and admin users can view active reset codes in the admin panel.

## Common Commands

```bash
# Development
make backend              # Start backend server
make migrate              # Run migrations
make migrate-create MESSAGE="description"  # Create migration
make seed                 # Seed admin user and initial data

# Testing
make test-backend         # Run backend tests
make lint-backend         # Lint with ruff
make format-backend       # Format with black + ruff

# Database
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "message"
uv run python seed.py
```
