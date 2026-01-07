# Project Documentation

## Project Overview

Appz Budget is a multi-platform budget management application that helps track expenses, manage budgets by category, and visualize spending patterns. The application replicates Excel budget spreadsheet functionality across web, mobile, and terminal interfaces.

## Architecture

The project consists of four main components:

1. **Backend**: Python FastAPI with SQLAlchemy ORM and SQLite database
2. **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
3. **Mobile**: React Native + Expo for iOS/Android
4. **TUI**: Rust terminal interface using Ratatui

All components connect to the same backend API, allowing users to access their budget data from any platform.

## Tech Stack Summary

### Backend

- FastAPI (Python)
- SQLAlchemy (ORM)
- SQLite (Database)
- Alembic (Migrations)
- Pydantic (Validation)
- JWT (Authentication)
- bcrypt (Password hashing)

### Frontend

- React 19
- TypeScript
- Tailwind CSS
- Vite
- TanStack Query
- Axios
- Recharts

### Mobile

- React Native
- Expo
- Expo Router
- TypeScript
- TanStack Query

### TUI

- Rust
- Ratatui
- Config: `~/.config/budget-tui/config.toml`

## Key Features

### Budget Tracking

- Track expenses and income by month
- Organize transactions with custom categories and color coding
- Create and manage multiple income types with budgeted amounts
- Filter and view expenses by category, period, or month
- Clone expenses to the next month for recurring bills
- Reorder expenses via drag and drop (web) or manual reordering
- Mark expenses as paid with payment tracking
- Close and reopen months for budget management

### Data Management

- Full CRUD operations for expenses, categories, periods, and income
- Excel spreadsheet import for easy data migration
- Backup and restore functionality
- Data persistence across sessions

### User Management

- Multi-user support with admin panel
- Secure authentication (JWT + API key)
- Password reset functionality
- User account management

### Analytics

- Real-time budget summaries and totals
- Visual spending patterns and trends
- Category-based expense breakdowns
- Income vs. expense comparisons
- Monthly budget overviews

### Security

- Secure biometric authentication (mobile)
- JWT-based authentication with secure token storage
- Self-hosted backend option for complete data privacy
- Password reset functionality with email support
- All data transmitted over secure HTTPS connections

## Project Structure

```
.
├── backend/              # Python FastAPI backend
│   ├── controllers/      # HTTP layer
│   ├── services/         # Business logic
│   ├── repositories/     # Data access
│   ├── models/           # ORM models
│   ├── alembic/          # Database migrations
│   ├── tests/            # Test suite
│   └── public/           # Frontend build output
├── frontend/             # React web app
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── contexts/     # React contexts
├── mobile/               # React Native mobile app
│   ├── src/
│   │   ├── screens/       # Expo Router screens
│   │   ├── hooks/        # Custom hooks
│   │   └── api/          # API client
├── tui/                  # Rust terminal UI
│   └── src/              # Rust source code
├── docs/                 # Documentation
├── docker-compose.yml    # Docker deployment
├── Dockerfile            # Docker build
└── Makefile              # Development commands
```

## Common Commands

### Development

```bash
make dev              # Start backend + frontend in parallel
make backend          # Start backend only (auto-runs migrations)
make frontend         # Start frontend only
make mobile-dev       # Start mobile dev server
make tui-dev          # Run TUI in development mode
```

### Testing

```bash
make test-backend     # Run backend tests (pytest)
make test-frontend    # Run frontend tests (vitest)
make test-mobile      # Run mobile tests (vitest)
make tui-test         # Run TUI tests (cargo test)
```

### Linting & Formatting

```bash
# Backend
make lint-backend     # Lint with ruff
make format-backend   # Format with black + ruff

# Frontend
make lint-frontend    # ESLint
make format-frontend  # Prettier

# Mobile
make lint-mobile      # ESLint
make type-check-mobile # TypeScript

# TUI
make tui-lint         # cargo clippy
make tui-format       # cargo fmt
```

### Full Verification

```bash
make verify           # Runs all lint, format, type checks, and tests
```

### Database

```bash
make migrate          # Apply pending migrations
make migrate-create MESSAGE="description"  # Create new migration
make seed             # Seed admin user (admin@email.com / admin)
```

### Build

```bash
make build            # Build frontend for production
make tui              # Build TUI release binary
```

## Data Flow

1. **User Action** → React/React Native Component
2. **Component** → Custom Hook (useExpenses, useCategories, etc.)
3. **Hook** → API Client (axios)
4. **API Client** → FastAPI Backend
5. **Backend** → Service → Repository → SQLAlchemy → SQLite Database
6. **Response** → TanStack Query Cache → Component Update

## API Authentication

All `/api/*` endpoints require:

1. **API Key**: `X-API-Key` header (configured via `API_KEY` environment variable)
2. **JWT Token**: For authenticated endpoints (stored in HTTP-only cookies)

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`

  - Interactive API explorer
  - Try out endpoints directly from the browser
  - Use the "Authorize" button to set your API key

- **ReDoc**: `http://localhost:8000/redoc`

  - Clean, readable API documentation
  - Alternative documentation format

- **OpenAPI Schema**: `http://localhost:8000/openapi.json`
  - Machine-readable API specification
  - Can be imported into API clients like Postman, Insomnia, etc.

The documentation is automatically updated when you modify the API endpoints.

## Environment Variables

### Backend

- `API_KEY` - Secret API key for backend authentication (**required**)
- `JWT_SECRET_KEY` - JWT token signing key
- `DATABASE_URL` - Database connection string
- `ENV` - Environment mode (`development` or `production`)
- `SMTP_*` - SMTP configuration for email (optional)
- `FRONTEND_URL` - Frontend URL for password reset links

### Frontend

- `VITE_API_KEY` - API key for development (optional, runtime injection preferred)

### Mobile

- API configuration stored locally on device
- Default API URL: `https://budget.appz.wtf` (demo server)

## Package Managers

- **Backend**: `uv` (commands run in `backend/` directory)
- **Frontend/Mobile**: `npm`
- **TUI**: `cargo`

## Docker Deployment

The application can be deployed using Docker:

```bash
# Quick start
docker-compose up -d

# Or build from source using Dockerfile directly
docker build -t appz-budget:latest .
docker run -d -p 8000:8000 -e API_KEY=your-secret-api-key appz-budget:latest
```

See [DOCKER.md](./DOCKER.md) for detailed Docker documentation.

## Development Workflow

### Starting a New Feature

1. Create a feature branch
2. Make changes
3. Run `make verify` to check everything
4. Write tests if needed
5. Commit changes
6. Push and create PR

### Code Patterns

#### When Updating Categories/Periods

Names cascade to related expenses automatically via service layer. No manual updates needed.

#### Excel Import

Handled by `import_service.py`. Required columns: `Expense details`, `Category`. Auto-creates missing categories/periods.

#### Error Handling

- Services raise custom exceptions (NotFoundError, ConflictError, ValidationError, DependencyError)
- Controllers convert exceptions to HTTPException with appropriate status codes
- Frontend/Mobile handle errors via TanStack Query error states

## Testing

### Backend

- **Framework**: pytest
- **Coverage**: 93% overall
- **Test Database**: In-memory SQLite (isolated per test)

### Frontend

- **Framework**: Vitest
- **Testing Library**: React Testing Library

### Mobile

- **Framework**: Vitest
- **Testing Library**: React Native Testing Library

### TUI

- **Framework**: cargo test

## Security

### Best Practices

1. **Never commit secrets**:

   - API keys
   - JWT secret keys
   - Database files
   - Environment files with credentials
   - Service account JSON files

2. **Use environment variables** for all sensitive configuration

3. **Password hashing**: bcrypt with automatic salt generation

4. **JWT tokens**: 30-day expiration, secure signing

5. **API key protection**: All API endpoints require valid API key

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## Demo Server

A demo server is available at `https://budget.appz.wtf/` for testing purposes.

**Demo Credentials:**

- Email: `admin@email.com`
- Password: `admin1`
- API Key: `your-secret-api-key-change-this`

**Note**: For production use, users must deploy their own backend server.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

## Contributing

See [CONTRIBUTING.md](../mobile/CONTRIBUTING.md) for contribution guidelines.

## Support

- **Issues**: https://github.com/kleyson/appz-budget/issues
- **Documentation**: See `docs/` directory
- **Demo Server**: https://budget.appz.wtf/

## Important Notes

1. **Starting any session**: Execute the command `codemap` to update yourself about the project
2. **Always run verify**: Run `make verify` before any commit
3. **Self-hosted**: The mobile app requires users to self-host their own backend server
4. **Data privacy**: All financial data is stored on the user's self-hosted server, not in the app or on our servers
