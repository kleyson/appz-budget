# Backend Migration & Summary Improvements Design

**Date:** 2026-02-14
**Status:** Approved

## Overview

Two major changes to Appz Budget:

1. **Backend Migration** — Replace Python/FastAPI backend with Bun + Hono + Drizzle ORM
2. **Summary UI Improvements** — Add charts, smart insights, and improved layout across all platforms
3. **Terminology Change** — Rename "budget" to "projected" throughout the entire app

### Motivation

- **Stack unification** — TypeScript everywhere (frontend, mobile, backend)
- **Deployment simplicity** — Single runtime (Bun), fewer dependencies
- **Better summary UX** — Current summary is table-heavy, lacks visual charts and actionable insights

---

## Part 1: Backend Migration (Python → Bun + Hono + Drizzle)

### Architecture

Replace the existing `backend/` directory in-place. Same layered architecture translated to TypeScript:

```
backend/
├── src/
│   ├── index.ts              # Hono app entry point
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema definitions
│   │   ├── migrate.ts        # Migration runner
│   │   ├── connection.ts     # SQLite connection via bun:sqlite
│   │   └── migrations/       # SQL migration files
│   ├── routes/               # Hono route handlers
│   │   ├── summary.ts
│   │   ├── expenses.ts
│   │   ├── income.ts
│   │   ├── categories.ts
│   │   ├── periods.ts
│   │   ├── months.ts
│   │   ├── income-types.ts
│   │   ├── auth.ts
│   │   ├── backup.ts
│   │   ├── import.ts
│   │   └── health.ts
│   ├── services/             # Business logic layer
│   │   ├── summary-service.ts
│   │   ├── expense-service.ts
│   │   ├── income-service.ts
│   │   ├── category-service.ts
│   │   ├── period-service.ts
│   │   ├── month-service.ts
│   │   ├── income-type-service.ts
│   │   ├── user-service.ts
│   │   └── import-service.ts
│   ├── middleware/
│   │   ├── api-key.ts        # X-API-Key validation
│   │   ├── auth.ts           # JWT Bearer token validation
│   │   └── cors.ts           # CORS configuration
│   ├── types/                # Shared TypeScript types/schemas
│   │   ├── schemas.ts        # Zod request/response schemas
│   │   └── index.ts          # Type exports
│   └── utils/
│       ├── auth.ts           # JWT & bcrypt helpers
│       ├── config.ts         # Environment config
│       ├── email.ts          # SMTP email sender
│       └── html-injector.ts  # Runtime API key injection
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── tests/
```

### Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Bun | Fast, built-in SQLite, native TS |
| Framework | Hono | Lightweight, fast, great middleware ecosystem |
| ORM | Drizzle | Type-safe, works with bun:sqlite, SQL-like API |
| Validation | Zod | Hono has built-in Zod validator middleware |
| Auth | jose | JWT library that works in Bun runtime |
| Password | bcrypt (via bun) | Bun has native bcrypt support |

### API Compatibility

All existing endpoints preserved with identical request/response shapes:

- `GET /api/v1/summary/totals`
- `GET /api/v1/summary/by-period`
- `GET /api/v1/summary/expenses-by-period`
- `GET /api/v1/summary/monthly-trends`
- All CRUD endpoints for expenses, income, categories, periods, months, income-types
- Auth endpoints (login, register)
- Backup/import endpoints
- Health check

**Zero frontend changes required for the migration itself.**

### Database

- Bun's built-in `bun:sqlite` for the connection
- Drizzle ORM schema generated to match existing SQLite database structure
- Existing database file (`budget.db`) continues to be used — no data migration needed
- Drizzle migrations for any future schema changes

### Key Mappings

| Python (FastAPI) | TypeScript (Hono) |
|-----------------|-------------------|
| FastAPI router | Hono router |
| Pydantic models | Zod schemas |
| SQLAlchemy models | Drizzle schema |
| SQLAlchemy session | Drizzle db instance |
| FastAPI Depends() | Hono middleware / context |
| uvicorn | Bun.serve() |
| python-jose JWT | jose library |
| bcrypt | Bun native bcrypt |

---

## Part 2: Summary UI Improvements

### New Backend Endpoint: Insights

`GET /api/v1/summary/insights`

Query params: `month_id?: number`

```typescript
interface SummaryInsights {
  insights: Array<{
    type: 'warning' | 'positive' | 'neutral';
    icon: string;          // 'trending-up' | 'trending-down' | 'alert' | 'check' | 'info'
    message: string;       // Human-readable insight
    category?: string;     // Optional, for linking to detail
  }>;
  savings_projection: number;
  budget_health: 'good' | 'warning' | 'critical';
  over_budget_count: number;
  total_categories: number;
}
```

**Insight generation logic:**
- Compare current month spending vs previous month per category (% change)
- Flag categories that are over projected
- Calculate projected end-of-month savings based on current spending rate
- Determine overall budget health (good: <80% spent, warning: 80-100%, critical: >100%)

### Web Frontend

**New components:**
- `InsightsBar` — Horizontal scrollable cards with top 3-5 insights, color-coded by type
- `ExpenseDonutChart` — Donut chart for expense distribution by category (Recharts)
- `BudgetComparisonChart` — Horizontal bars showing projected vs actual per period (Recharts)
- `TrendSparkline` — Mini line chart for 6-month income/expense trends (Recharts)

**Charting library:** Recharts (lightweight, React-native, composable)

**Layout (desktop, 2-column):**
```
┌─────────────────────────────────────────────────┐
│  Overview Cards (Income | Expenses | Balance)    │
├─────────────────────────────────────────────────┤
│  Insights Bar (horizontal scrollable cards)      │
├───────────────────────┬─────────────────────────┤
│  Expense Donut Chart  │  Projected vs Actual     │
│  (by category)        │  Bar Chart (by period)   │
├───────────────────────┴─────────────────────────┤
│  6-Month Trend Sparkline                         │
├─────────────────────────────────────────────────┤
│  ▼ Summary by Period (collapsible)               │
│  ▼ Expenses by Period (collapsible)              │
│  ▼ Expenses by Category (collapsible)            │
│  ▼ Income Summary (collapsible)                  │
└─────────────────────────────────────────────────┘
```

**Mobile layout:** Same components, single-column stacked. Charts use Victory Native or react-native-chart-kit.

**TUI:** ASCII bar charts (Ratatui built-in widgets), text-based insights rendered as a list.

### Collapsible Tables

Tables become collapsible sections (expanded by default). Clicking the section header toggles visibility. This reduces visual overwhelm while keeping data accessible.

---

## Part 3: Terminology Change ("budget" → "projected")

Global rename across all platforms:

### Backend
- Pydantic/Zod schema field names: `budget` → `projected` (API response fields)
- Database column: `budget` → `projected` in expenses and incomes tables (Drizzle migration)
- Service logic variable names
- Summary endpoint response fields: `total_budgeted_*` → `total_projected_*`

### Frontend (Web)
- TypeScript types: all `budget`/`budgeted` fields → `projected`
- UI labels: "Budget" → "Projected", "Budgeted" → "Projected"
- "On Budget" / "Over Budget" badges → "On Track" / "Over Projected"
- SummaryCards: "of $X budgeted" → "of $X projected"

### Mobile
- Same changes as web (parallel component structure)

### TUI
- Rust model fields and UI labels

### API Contract Change
This is a **breaking change** to the API response shape. Since we're replacing the backend anyway, this is the right time to do it. All frontends get updated simultaneously.

---

## Execution Order

1. **Backend migration first** — Get Bun + Hono + Drizzle running with identical API
2. **Terminology rename** — Change "budget" to "projected" in new backend + all frontends
3. **Summary insights endpoint** — Add the new `/insights` endpoint
4. **Summary UI improvements** — Add charts, insights bar, and new layout to web → mobile → TUI

This order minimizes risk: the backend migration is validated independently before any UI changes.

---

## Out of Scope

- No new database tables (insights are computed on-the-fly)
- No user preference storage for chart types
- No real-time/WebSocket updates
- No new authentication flows
- No changes to the existing backup/import functionality (just ported)
