# Budget Management Application - Project Notes

## Project Overview

A full-stack budget management application that helps track expenses, manage budgets by category, and visualize spending patterns. The application replicates Excel budget spreadsheet functionality in a web-based interface.

## Architecture

- **Backend**: FastAPI (Python) with SQLite database
- **Frontend**: React with Vite build tool
- **Communication**: RESTful API with CORS enabled
- **Data Fetching**: TanStack Query (React Query) for state management and caching

## Tech Stack

### Backend Dependencies

- `fastapi==0.115.0` - Web framework
- `uvicorn[standard]==0.32.0` - ASGI server
- `sqlalchemy==2.0.36` - ORM
- `pydantic>=2.10.0` - Data validation (resolves to 2.12.4+ for Python 3.14 compatibility)
- `python-multipart==0.0.12` - File upload support
- `openpyxl==3.1.5` - Excel file reading
- `pandas==2.3.3` - Data processing

### Frontend Dependencies

- `react@^19.2.0` - UI library
- `@tanstack/react-query@^5.90.10` - Data fetching and caching
- `@tanstack/react-query-devtools@^5.90.2` - Development tools
- `axios@^1.13.2` - HTTP client
- `recharts@^3.4.1` - Chart library
- `vite@^7.2.2` - Build tool

## Database Schema

### Tables

#### `expenses` table

- `id` (Integer, Primary Key, Indexed)
- `expense_name` (String, Not Null, Indexed)
- `period` (String, Not Null, Indexed)
- `category` (String, Not Null, Indexed)
- `budget` (Float, Default: 0.0)
- `cost` (Float, Default: 0.0)
- `notes` (Text, Nullable)

#### `categories` table

- `id` (Integer, Primary Key, Indexed)
- `name` (String, Unique, Not Null, Indexed)

#### `periods` table

- `id` (Integer, Primary Key, Indexed)
- `name` (String, Unique, Not Null, Indexed)

### Authentication

- **Type**: API Key authentication
- **Header**: `X-API-Key`
- **Configuration**: Set `API_KEY` environment variable
- **Protected Endpoints**: All `/api/*` endpoints
- **Public Endpoints**: Root endpoint (`/`) only

### Database Configuration

- **Location**: `backend/budget.db` (SQLite)
- **Connection**: `sqlite:///./budget.db`
- **ORM**: SQLAlchemy with declarative base
- **Session Management**: SessionLocal with dependency injection
- **Migrations**: Managed via Alembic
  - Migration files: `backend/alembic/versions/`
  - Configuration: `backend/alembic.ini` and `backend/alembic/env.py`
  - Commands:
    - `uv run alembic upgrade head` - Apply all pending migrations
    - `uv run alembic revision --autogenerate -m "message"` - Create new migration
    - `uv run alembic downgrade -1` - Rollback last migration
    - `uv run alembic current` - Show current migration version

## API Endpoints

### Base URL

- Development: `http://localhost:8000`
- API Documentation:
  - Swagger UI: `http://localhost:8000/docs` (requires API key - use "Authorize" button)
  - ReDoc: `http://localhost:8000/redoc` (requires API key)

### Authentication

All API endpoints require the `X-API-Key` header with a valid API key:
```bash
curl -H "X-API-Key: your-api-key" http://localhost:8000/api/expenses
```

The API key is configured via the `API_KEY` environment variable on the server.

### Expense Endpoints

- `GET /api/expenses` - Get all expenses (query params: `period`, `category`)
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/{expense_id}` - Get specific expense
- `PUT /api/expenses/{expense_id}` - Update expense
- `DELETE /api/expenses/{expense_id}` - Delete expense

### Category Endpoints

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/{category_id}` - Update category (also updates related expenses)
- `DELETE /api/categories/{category_id}` - Delete category (only if not used)
- `GET /api/categories/summary` - Get category summary with totals (query param: `period`)

### Period Endpoints

- `GET /api/periods` - Get all periods
- `POST /api/periods` - Create new period
- `PUT /api/periods/{period_id}` - Update period (also updates related expenses)
- `DELETE /api/periods/{period_id}` - Delete period (only if not used)

### Import Endpoint

- `POST /api/import/excel` - Import expenses from Excel file (multipart/form-data)

## Backend Architecture

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

## Frontend Structure

### Main Application

- **Entry Point**: `frontend/src/main.jsx`
- **Main Component**: `frontend/src/App.jsx`
- **API Client**: `frontend/src/api/client.js` (base URL: `http://localhost:8000`)

### Components

1. **ExpenseList.jsx** - Display and manage expenses
2. **ExpenseForm.jsx** - Form for creating/editing expenses
3. **CategorySummary.jsx** - Category budget vs actual summary
4. **Charts.jsx** - Visualizations (budget vs actual, distribution)
5. **ExcelImport.jsx** - Excel file import interface
6. **CategoryManagement.jsx** - CRUD for categories
7. **PeriodManagement.jsx** - CRUD for periods

### Custom Hooks

- `useExpenses.js` - Expense data fetching and mutations
- `useCategories.js` - Category data fetching and mutations
- `usePeriods.js` - Period data fetching and mutations

### Application Tabs

1. **Expenses** - Main expense list with filters
2. **Summary** - Category summary with budget comparisons
3. **Charts** - Visual data representations
4. **Import** - Excel file import
5. **Categories** - Category management
6. **Periods** - Period management

## Key Features

### Budget Tracking

- Track expenses by category and period
- Budget vs actual cost comparison
- Real-time budget status indicators (✅ green when budget >= cost, 🔴 red otherwise)
- Category summaries with automatic totals (SUMIF-like logic)

### Data Management

- Full CRUD operations for expenses, categories, and periods
- Excel import with flexible column mapping
- Period and category filtering
- Automatic creation of categories/periods during import

### Excel Import Details

- **Required Columns**: `Expense details`, `Category`
- **Optional Columns**: `Period` (defaults to "Fixed/1st Period"), `Budget`, `Cost`, `Notes`
- **Column Mapping**: Handles variations like "expense", "expense name", "actual", "actual cost", etc.
- **Error Handling**: Skips invalid rows, reports errors, continues processing
- **Auto-creation**: Creates categories and periods if they don't exist

### Data Validation

- Server-side validation using Pydantic schemas
- Prevents duplicate categories/periods
- Prevents deletion of categories/periods in use
- Updates related expenses when category/period names change

## Important Implementation Details

### Backend Architecture

- **Layered Architecture**:
  - **Controllers**: Handle HTTP requests/responses, delegate to services
  - **Services**: Contain business logic, use repositories for data access
  - **Repositories**: Handle all database operations (CRUD, queries)
  - **Models**: SQLAlchemy ORM models
- **CORS**: Enabled for `http://localhost:3000` and `http://localhost:5173`
- **Authentication**: API Key via `X-API-Key` header (configured via `API_KEY` environment variable)
- **Database**: Tables created and managed via Alembic migrations (run `alembic upgrade head` before starting)
- **Session Management**: Dependency injection pattern with `get_db()`
- **Error Handling**:
  - Services raise custom exceptions (NotFoundError, ConflictError, ValidationError, DependencyError)
  - Controllers convert exceptions to HTTPException with appropriate status codes
- **Dependency Injection**: Services receive repositories as dependencies, not database sessions
- **Excel Processing**: Uses pandas with openpyxl engine, handles NaN values gracefully

### Frontend

- **State Management**: TanStack Query for server state, React useState for UI state
- **Query Configuration**:
  - `refetchOnWindowFocus: false`
  - `retry: 1`
- **DevTools**: React Query DevTools included
- **Filtering**: Client-side filtering by period and category
- **Port**: Default Vite dev server port 5173

### Category/Period Updates

- When updating a category/period name, all related expenses are automatically updated
- This ensures data consistency across the application

## Development Setup

### Prerequisites

- Python 3.13+ (or 3.12)
- Node.js 18+ and npm
- uv (Python package manager)
- Virtual environment at project root (`.venv`)

### Backend Setup

```bash
cd backend
uv sync
uv run alembic upgrade head  # Run migrations to create tables
uv run python main.py
```

- Runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Runs on `http://localhost:5173` (or next available port)

### Development Commands

The project uses a `Makefile` for common development tasks:

- `make install` - Install all dependencies
- `make dev` - Start both backend and frontend in parallel
- `make backend` - Start backend server only
- `make frontend` - Start frontend dev server only
- `make test` - Run all tests
- `make migrate` - Run database migrations
- `make clean` - Clean build artifacts

See `make help` for the complete list of commands.

## File Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # SQLAlchemy database configuration
│   ├── dependencies.py     # Shared dependencies (get_db)
│   ├── exceptions.py        # Custom business logic exceptions
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py     # Model exports
│   │   ├── expense.py      # Expense model
│   │   ├── category.py     # Category model
│   │   └── period.py       # Period model
│   ├── controllers/         # API controllers (HTTP layer)
│   │   ├── __init__.py     # Controller exports
│   │   ├── expense_controller.py    # Expense endpoints
│   │   ├── category_controller.py    # Category endpoints
│   │   ├── period_controller.py     # Period endpoints
│   │   └── import_controller.py    # Excel import endpoint
│   ├── services/            # Business logic layer
│   │   ├── __init__.py     # Service exports
│   │   ├── expense_service.py      # Expense business logic
│   │   ├── category_service.py    # Category business logic
│   │   ├── period_service.py      # Period business logic
│   │   └── import_service.py      # Excel import business logic
│   ├── repositories/        # Data access layer
│   │   ├── __init__.py     # Repository exports
│   │   ├── expense_repository.py  # Expense database operations
│   │   ├── category_repository.py # Category database operations
│   │   └── period_repository.py   # Period database operations
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── pyproject.toml        # Python dependencies (uv)
│   ├── alembic/              # Alembic migration files
│   │   ├── versions/         # Migration version files
│   │   └── env.py            # Alembic environment configuration
│   ├── alembic.ini           # Alembic configuration file
│   ├── budget.db            # SQLite database (created by migrations)
│   └── __pycache__/         # Python cache
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js    # Axios API client with all endpoints
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── App.css          # Styles
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
├── 2025 Home Budget - Kleyson.xlsx  # Sample Excel file
├── Makefile                  # Development commands
└── README.md                # User-facing documentation
```

## Data Flow

1. **User Action** → React Component
2. **Component** → Custom Hook (useExpenses, useCategories, etc.)
3. **Hook** → API Client (axios)
4. **API Client** → FastAPI Backend
5. **Backend** → SQLAlchemy ORM → SQLite Database
6. **Response** → TanStack Query Cache → Component Update

## Business Logic

### Budget Status Calculation

- `over_budget = budget >= total` (green ✅)
- `over_budget = budget < total` (red 🔴)

### Category Summary

- Groups expenses by category
- Sums budget and cost values per category
- Calculates over_budget status
- Can be filtered by period

### Excel Import Logic

1. Read Excel file with pandas
2. Normalize column names (handle variations)
3. Validate required columns exist
4. For each row:
   - Skip if essential data missing
   - Create category if doesn't exist
   - Create period if doesn't exist (default: "Fixed/1st Period")
   - Parse budget and cost (handle NaN, default to 0.0)
   - Create expense record
5. Commit all changes or rollback on critical errors

## Testing

### Test Suite
- **Framework**: pytest with pytest-cov for coverage
- **Coverage**: 93% overall coverage
- **Test Database**: In-memory SQLite (isolated per test)
- **Test Structure**:
  - Repository tests: 100% coverage
  - Service tests: 100% coverage (most services)
  - Controller tests: Full endpoint coverage
- **Running Tests**: `uv run pytest tests/`
- **Coverage Report**: `uv run pytest tests/ --cov=. --cov-report=html`

### Test Files
- `tests/test_repositories.py` - Repository layer tests
- `tests/test_services.py` - Service layer tests
- `tests/test_controllers.py` - Controller/HTTP endpoint tests
- `tests/conftest.py` - Pytest fixtures and test database setup

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

## Notes for Future Development

- Database is SQLite (easy to migrate to PostgreSQL if needed)
- No authentication/authorization currently implemented
- All calculations performed server-side for accuracy
- Frontend uses modern React patterns (hooks, functional components)
- Backend follows RESTful conventions
- API uses Pydantic for automatic validation and documentation
- Excel import is flexible but requires specific column structure
- Category/Period management prevents orphaned data through validation
- Comprehensive test suite with 93% coverage ensures code quality

## CI/CD and Deployment

### GitHub Actions

- **Test Workflow** (`.github/workflows/test.yml`):
  - Runs on PRs and pushes to main branches
  - Executes backend tests and frontend build
  - Blocks PR merge if tests fail (when branch protection enabled)

- **Build and Release** (`.github/workflows/build-and-release.yml`):
  - Builds Docker image on version tags
  - Publishes to GitHub Container Registry
  - Multi-stage build for optimized image size

### Docker

- **Multi-stage Dockerfile**:
  - Stage 1: Builds frontend React app using `node:22-alpine`
  - Stage 2: Sets up Python backend using `python:3.12-slim` with uv
  - Stage 3: Final minimal image with both frontend and backend
- **Static file serving**: FastAPI serves built frontend from `/static`
- **Health checks**: Built-in container health monitoring using curl
- **Database migrations**: Automatically run on container startup via `docker-entrypoint.sh`
- **Image optimization**:
  - Uses newer base images (Node 22, Python 3.12)
  - Multi-stage build for minimal final image size (~400-500MB)
  - Better layer caching for faster rebuilds
  - Runs as non-root user for security
- **Build configuration**:
  - `compose.build.yml`: For building images from source
  - `docker-compose.yml`: For end users pulling from GitHub packages
  - `Dockerfile`: Optimized multi-stage build
  - `.dockerignore`: Excludes unnecessary files

### Deployment

- **Docker image**: Available at `ghcr.io/[username]/appz-budget:latest`
- **Single container deployment**: Frontend + backend in one container
- **Environment variables**:
  - `API_KEY`: Required for API authentication
  - `VITE_API_KEY`: Required at build time for frontend (only for building)
  - `DATABASE_URL`: Optional (defaults to `sqlite:///./data/budget.db`)
  - `PORT`: Optional (defaults to `8000`)
  - `ENV`: Optional (defaults to `production`)
- **Data persistence**: Uses Docker volumes (`budget-data`) to persist database
- **Quick start**: Users can download `docker-compose.yml` via wget and run without cloning the repo
- **Labels**: Uses `wtf.appz.budget.*` namespace for container labels

### Docker Setup Details

#### Building the Image

To build the Docker image from source:

```bash
docker-compose -f compose.build.yml build
```

Or using Docker directly:

```bash
docker build -t appz-budget:latest --build-arg VITE_API_KEY=your-api-key .
```

#### Running from GitHub Packages

End users can run the application without cloning the repository:

```bash
# Download docker-compose.yml
wget https://raw.githubusercontent.com/YOUR_USERNAME/appz-budget/main/docker-compose.yml

# Create .env file
cat > .env << EOF
API_KEY=your-secret-api-key-change-this
PORT=8000
DATABASE_URL=sqlite:///./data/budget.db
EOF

# Start the application
docker-compose up -d
```

#### Manual Installation (for Development)

See the "Development Setup" section above for manual installation instructions without Docker.
