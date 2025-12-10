# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Appz Budget is a multi-platform budget management application with four components:

- **Backend**: Python FastAPI with SQLAlchemy ORM and SQLite database
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **Mobile**: React Native + Expo for iOS/Android
- **TUI**: Rust terminal interface using Ratatui

## Common Commands

### Development

```bash
make dev              # Start backend + frontend in parallel
make backend          # Start backend only (auto-runs migrations)
make frontend         # Start frontend only
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

### Full Verification (all platforms)

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

## Architecture

### Backend (backend/)

Layered architecture with dependency injection:

- **Controllers** (`controllers/`): HTTP layer, request/response handling
- **Services** (`services/`): Business logic, raises custom exceptions
- **Repositories** (`repositories/`): Database operations via SQLAlchemy
- **Models** (`models/`): ORM models

Custom exceptions in `exceptions.py`: `NotFoundError`, `ConflictError`, `ValidationError`, `DependencyError`

Entry point: `main.py`
Database migrations: `alembic/versions/`

### Frontend (frontend/src/)

- `api/client.ts` - Axios client with all API endpoints
- `components/` - React components
- `hooks/` - Custom hooks (useExpenses, useCategories, usePeriods, etc.)
- `contexts/` - React context providers
- State management: TanStack Query

### Mobile (mobile/src/)

- Same hook pattern as frontend
- `screens/` - Expo Router screens
- `api/client.ts` - API client (configure URL for emulator/device)
- Uses expo-router for navigation

### TUI (tui/src/)

- Rust with Ratatui framework
- Config at: `~/.config/budget-tui/config.toml` (Linux), `~/Library/Application Support/budget-tui/config.toml` (macOS)

## API Authentication

All `/api/*` endpoints require `X-API-Key` header. Configure via `API_KEY` environment variable.

## Key Patterns

### Data Flow

1. React component → Custom hook → API client → FastAPI → SQLAlchemy → SQLite
2. Response → TanStack Query cache → Component update

### When Updating Categories/Periods

Names cascade to related expenses automatically via service layer.

### Excel Import

Handled by `import_service.py`. Required columns: `Expense details`, `Category`. Auto-creates missing categories/periods.

## Environment Variables

- `API_KEY` / `VITE_API_KEY` - API authentication key
- `DATABASE_URL` - SQLite connection (default: `sqlite:///./data/budget.db`)
- `ENV` - `development` enables hot reload

## Package Managers

- Backend: `uv` (commands in backend/)
- Frontend/Mobile: `npm`
- TUI: `cargo`

** IMPORTANT **

1. Starting any session you need to execute the command `codemap` to update yourself more about the project
2. Always run the verify command before any commit
