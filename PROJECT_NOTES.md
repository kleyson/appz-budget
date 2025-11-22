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
- `pydantic==2.9.2` - Data validation
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

### Database Configuration

- **Location**: `backend/budget.db` (SQLite)
- **Connection**: `sqlite:///./budget.db`
- **ORM**: SQLAlchemy with declarative base
- **Session Management**: SessionLocal with dependency injection

## API Endpoints

### Base URL

- Development: `http://localhost:8000`
- API Documentation:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

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

### Backend

- **CORS**: Enabled for `http://localhost:3000` and `http://localhost:5173`
- **Database**: Tables created automatically on startup via `Base.metadata.create_all()`
- **Session Management**: Dependency injection pattern with `get_db()`
- **Error Handling**: HTTPException with appropriate status codes
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

### Startup Scripts

- `start_backend.sh` - Starts backend server
- `start_frontend.sh` - Starts frontend dev server

## File Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application and all endpoints
│   ├── database.py          # SQLAlchemy database configuration
│   ├── models.py            # SQLAlchemy ORM models (Expense, Category, Period)
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── pyproject.toml        # Python dependencies (uv)
│   ├── budget.db            # SQLite database (created on first run)
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
├── start_backend.sh         # Backend startup script
├── start_frontend.sh        # Frontend startup script
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

## Notes for Future Development

- Database is SQLite (easy to migrate to PostgreSQL if needed)
- No authentication/authorization currently implemented
- All calculations performed server-side for accuracy
- Frontend uses modern React patterns (hooks, functional components)
- Backend follows RESTful conventions
- API uses Pydantic for automatic validation and documentation
- Excel import is flexible but requires specific column structure
- Category/Period management prevents orphaned data through validation
