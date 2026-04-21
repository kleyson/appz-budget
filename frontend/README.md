# Frontend - Appz Budget

React 19 + TypeScript + Tailwind CSS + Vite web application for budget management.

## Features

- 📊 Monthly budget tracking with expense and income management
- 🎨 Custom categories and periods with color coding
- 📈 Visual analytics with interactive charts
- 💾 Backup and restore for database migration
- 🔐 Secure JWT-based authentication
- 👥 User management (admin panel)
- 🌙 Dark mode support
- 📱 Responsive design

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Chart library
- **@dnd-kit** - Drag and drop for expense reordering

## Development

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Running

```bash
# Development server
npm run dev

# Or using Makefile from project root
make frontend
```

The app will be available at `http://localhost:5173` (or next available port).

### Building

```bash
# Production build
npm run build

# Or using Makefile
make build
```

The build output goes to `backend/public/` and is served by the FastAPI backend.

## Project Structure

```
frontend/src/
├── api/
│   └── client.ts          # Axios API client with all endpoints
├── components/             # React components
│   ├── ExpenseList.tsx
│   ├── ExpenseForm.tsx
│   ├── CategorySummary.tsx
│   ├── Charts.tsx
│   ├── CategoryManagement.tsx
│   ├── PeriodManagement.tsx
│   ├── Settings.tsx
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useExpenses.ts
│   ├── useCategories.ts
│   ├── usePeriods.ts
│   ├── useIncomes.ts
│   ├── useIncomeTypes.ts
│   ├── useMonths.ts
│   ├── useSummary.ts
│   ├── useUsers.ts
├── contexts/              # React context providers
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── App.css                # Global styles
```

## API Integration

The frontend communicates with the FastAPI backend:

- **Base URL**: `http://localhost:8000` (development)
- **API Key**: Injected at runtime by the backend
- **Authentication**: JWT tokens stored in HTTP-only cookies

All API endpoints are defined in `src/api/client.ts`.

## State Management

- **TanStack Query**: Server state and caching
- **React useState**: Local UI state
- **React Context**: Global app state (theme, user)

## Testing

```bash
# Run tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests once
npm run test:run
```

## Linting & Formatting

```bash
# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

## Environment Variables

The frontend receives the API key at runtime via HTML injection. The backend injects the API key into `index.html` when serving the frontend.

For development, you can optionally set `VITE_API_KEY` in a `.env` file, but runtime injection is preferred.

## Key Features

### Expense Management
- Create, read, update, delete expenses
- Reorder expenses via drag and drop
- Mark expenses as paid
- Clone expenses to next month
- Filter by period, category, month

### Income Management
- Track multiple income types
- Monthly income tracking
- Income summaries

### Analytics
- Category summaries with budget vs actual
- Period summaries
- Monthly trends
- Interactive charts

### Data Management
- Database backup download
- Database restore from server-side or uploaded `.db` backups

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Same as the main project (MIT).
