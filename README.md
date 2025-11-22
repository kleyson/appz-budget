# Budget Management Application

A full-stack budget management application built with FastAPI, React, and SQLite. This application helps you track expenses, manage budgets by category, and visualize your spending patterns.

## Features

- ✅ Add, edit, and delete expenses
- ✅ Track expenses by category and period
- ✅ Category summary with budget vs actual comparisons
- ✅ Interactive charts and visualizations
- ✅ Import data from Excel files
- ✅ Filter expenses by period and category
- ✅ Real-time budget status indicators (✅/🔴)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Pandas** - Excel file processing

### Frontend
- **React** - UI library
- **TanStack Query** - Data fetching and caching
- **Recharts** - Chart library
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application
│   ├── database.py       # Database configuration
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   └── pyproject.toml    # Python dependencies (uv)
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.jsx       # Main app component
│   └── package.json      # Node dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.13+ (or 3.12)
- Node.js 18+ and npm
- uv (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment:
```bash
source ../.venv/bin/activate
```

3. Install dependencies:
```bash
uv sync
```

4. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is busy)

## Usage

### Adding Expenses

1. Click on the "Expenses" tab
2. Click "+ Add Expense"
3. Fill in the expense details:
   - Expense Name
   - Period (e.g., "Fixed/1st Period")
   - Category (e.g., "Groceries", "Subscriptions")
   - Budget amount
   - Actual Cost
   - Optional notes
4. Click "Create"

### Viewing Summary

1. Click on the "Summary" tab
2. View category summaries with budget vs actual comparisons
3. Use filters to view specific periods

### Viewing Charts

1. Click on the "Charts" tab
2. View visualizations of your budget data:
   - Budget vs Actual bar chart
   - Budget distribution pie chart

### Importing from Excel

1. Click on the "Import" tab
2. Select your Excel file (must have columns: Expense details, Period, Category, Budget, Cost, Notes)
3. Click "Import"
4. Your expenses will be imported into the database

## API Endpoints

- `GET /api/expenses` - Get all expenses (optional filters: period, category)
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses/{id}` - Get a specific expense
- `PUT /api/expenses/{id}` - Update an expense
- `DELETE /api/expenses/{id}` - Delete an expense
- `GET /api/categories` - Get all categories
- `GET /api/categories/summary` - Get category summary with totals
- `GET /api/periods` - Get all periods
- `POST /api/import/excel` - Import expenses from Excel file

## Database

The application uses SQLite and creates a `budget.db` file in the backend directory on first run. The database schema includes:

- **expenses** table with columns:
  - id (primary key)
  - expense_name
  - period
  - category
  - budget
  - cost
  - notes

## Development

### Backend Development

The backend uses FastAPI with automatic API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Development

The frontend uses Vite for fast development with hot module replacement. TanStack Query DevTools are included for debugging queries.

## Notes

- The application replicates the functionality of your Excel budget spreadsheet
- Budget status indicators (✅/🔴) show green when budget >= cost, red otherwise
- Category summaries automatically calculate totals using SUMIF-like logic
- All calculations are performed server-side for accuracy
