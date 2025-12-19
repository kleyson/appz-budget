# Frontend Documentation

## Overview

The frontend is built with **React 19 + TypeScript + Tailwind CSS + Vite**. It uses TanStack Query for state management and data fetching.

## Tech Stack

### Frontend Dependencies

- `react@^19.2.0` - UI library
- `@tanstack/react-query@^5.90.10` - Data fetching and caching
- `@tanstack/react-query-devtools@^5.90.2` - Development tools
- `axios@^1.13.2` - HTTP client
- `recharts@^3.4.1` - Chart library
- `@dnd-kit/core@^6.3.1` - Drag and drop core
- `@dnd-kit/sortable@^10.0.0` - Sortable drag and drop
- `vite@^7.2.2` - Build tool
- `typescript` - Type safety
- `tailwindcss` - Utility-first CSS framework

### Package Manager

- **npm** - Node package manager

## Architecture

### Structure

```
frontend/src/
├── api/
│   └── client.ts        # Axios client with all API endpoints
├── components/          # React components
│   ├── ExpenseList.tsx
│   ├── ExpenseForm.tsx
│   ├── CategorySummary.tsx
│   ├── Charts.tsx
│   ├── ExcelImport.tsx
│   ├── CategoryManagement.tsx
│   ├── PeriodManagement.tsx
│   ├── Settings.tsx
│   ├── ChangePassword.tsx
│   ├── PasswordResetManagement.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useExpenses.ts
│   ├── useCategories.ts
│   ├── usePeriods.ts
│   ├── useIncomes.ts
│   ├── useIncomeTypes.ts
│   ├── useMonths.ts
│   ├── useSummary.ts
│   ├── useUsers.ts
│   └── useImport.ts
├── contexts/           # React context providers
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── App.css             # Styles
```

### State Management

- **TanStack Query**: Server state management and caching
- **React useState**: Local UI state
- **React Context**: Global app state (theme, user, etc.)

### Query Configuration

```typescript
{
  refetchOnWindowFocus: false,
  retry: 1,
  staleTime: 5 * 60 * 1000, // 5 minutes
}
```

## API Client

### Configuration

Located in `frontend/src/api/client.ts`:
- Base URL: `http://localhost:8000` (development)
- API key injected at runtime from backend
- All requests include `X-API-Key` header
- JWT tokens stored in cookies (HTTP-only)
- **API Documentation**: Available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc)

### API Methods

All API endpoints are defined in the client:
- Expenses CRUD (create, read, update, delete, reorder, clone to next month, mark as paid)
- Categories CRUD
- Periods CRUD
- Income Types CRUD
- Incomes CRUD
- Months CRUD (create, close, open)
- Summary (totals, by period, monthly trends)
- Import (Excel)
- Authentication (register, login, password reset, change password)
- User management (admin)
- Backups (admin)

## Custom Hooks

### Data Fetching Hooks

All hooks follow the same pattern using TanStack Query:

```typescript
// Example: useExpenses
const { data, isLoading, error, refetch } = useExpenses();
const { mutate: createExpense } = useCreateExpense();
const { mutate: updateExpense } = useUpdateExpense();
const { mutate: deleteExpense } = useDeleteExpense();
```

### Available Hooks

- `useExpenses()` - Expense data fetching and mutations
- `useCategories()` - Category data fetching and mutations
- `usePeriods()` - Period data fetching and mutations
- `useIncomes()` - Income data fetching and mutations
- `useIncomeTypes()` - Income type data fetching and mutations
- `useMonths()` - Month data fetching and mutations
- `useSummary()` - Summary data fetching
- `useUsers()` - User management (admin)
- `useImport()` - Excel import functionality

## Components

### Main Application Tabs

1. **Expenses** - Main expense list with filters
2. **Summary** - Category summary with budget comparisons
3. **Charts** - Visual data representations
4. **Import** - Excel file import
5. **Categories** - Category management
6. **Periods** - Period management
7. **Settings** - User settings, password management, admin panel

### Key Components

- **ExpenseList**: Display and manage expenses with filtering
- **ExpenseForm**: Form for creating/editing expenses
- **CategorySummary**: Category budget vs actual summary
- **Charts**: Visualizations (budget vs actual, distribution)
- **ExcelImport**: Excel file import interface
- **CategoryManagement**: CRUD for categories
- **PeriodManagement**: CRUD for periods
- **Settings**: User settings and admin panel

## Development Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd frontend
npm install
```

### Running

```bash
# Development server
npm run dev

# Or using Makefile
make frontend
```

Runs on `http://localhost:5173` (or next available port)

### Building

```bash
# Production build
npm run build

# Or using Makefile
make build
```

Output: `backend/public/` (served by FastAPI in production)

## Environment Variables

### Development

- `VITE_API_KEY` - API key for development (optional, runtime injection preferred)

### Runtime Configuration

The frontend receives the API key at runtime via HTML injection. The backend injects the API key into `index.html` when serving the frontend.

## Features

### Budget Tracking

- Track expenses by category and period
- Budget vs actual cost comparison
- Real-time budget status indicators (✅ green when budget >= cost, 🔴 red otherwise)
- Category summaries with automatic totals
- Reorder expenses via drag and drop
- Mark expenses as paid with payment tracking
- Clone expenses to next month for recurring bills
- Month closing and reopening

### Data Management

- Full CRUD operations for expenses, categories, and periods
- Excel import with flexible column mapping
- Period and category filtering
- Automatic creation of categories/periods during import

### Excel Import

- **Required Columns**: `Expense details`, `Category`
- **Optional Columns**: `Period` (defaults to "1st Period"), `Budget`, `Cost`, `Notes`
- **Column Mapping**: Handles variations like "expense", "expense name", "actual", "actual cost", etc.
- **Error Handling**: Skips invalid rows, reports errors, continues processing
- **Auto-creation**: Creates categories and periods if they don't exist

### Authentication

- JWT-based authentication
- Login/registration forms
- Password reset functionality
- Change password
- Admin user management

### User Interface

- Dark mode support
- Responsive design
- Modern, clean interface
- Real-time updates via TanStack Query

## Data Flow

1. **User Action** → React Component
2. **Component** → Custom Hook (useExpenses, useCategories, etc.)
3. **Hook** → API Client (axios)
4. **API Client** → FastAPI Backend
5. **Response** → TanStack Query Cache → Component Update

## Filtering

Client-side filtering by:
- Period
- Category
- Month
- Payment status

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Automatic theme switching
- **Responsive**: Mobile-first design

## Testing

### Running Tests

```bash
# Run tests
npm test

# Or using Makefile
make test-frontend
```

### Test Framework

- **Vitest** - Test runner
- **React Testing Library** - Component testing

## Linting & Formatting

```bash
# Lint
npm run lint
# Or: make lint-frontend

# Format
npm run format
# Or: make format-frontend
```

## Build Output

The production build outputs to `backend/public/`:
- `index.html` - Main HTML file (with runtime API key injection)
- `index-*.js` - JavaScript bundles
- `index-*.css` - CSS bundles
- Static assets (images, fonts, etc.)

The backend serves these files via FastAPI's StaticFiles.

## Common Commands

```bash
# Development
make frontend          # Start frontend dev server
npm run dev            # Start Vite dev server

# Building
make build             # Build frontend for production
npm run build          # Build with Vite

# Testing
make test-frontend     # Run frontend tests
npm test               # Run tests

# Linting
make lint-frontend     # ESLint
make format-frontend   # Prettier
```

## Integration with Backend

### API Key Injection

The backend injects the API key at runtime:
1. Frontend requests `/` or any route
2. Backend serves `index.html`
3. Backend injects API key into HTML: `window.API_KEY = "..."`
4. Frontend uses injected API key for all API requests

### CORS

In development:
- CORS enabled for `http://localhost:3000` and `http://localhost:5173`

In production:
- Frontend served from same origin (no CORS needed)
- All requests are same-origin

### Authentication

- JWT tokens stored in HTTP-only cookies
- Automatic token refresh
- Logout clears cookies and cache

