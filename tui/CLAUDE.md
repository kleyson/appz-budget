# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Run directly (development)
go run .

# Build binary
go build -o budget-tui .

# Run tests
go test ./...

# Run a single test
go test -v -run TestFunctionName ./internal/config/

# Cross-platform builds
GOOS=linux GOARCH=amd64 go build -o budget-tui-linux .
GOOS=darwin GOARCH=arm64 go build -o budget-tui-mac .
GOOS=windows GOARCH=amd64 go build -o budget-tui.exe .
```

## Architecture

This is a Terminal User Interface (TUI) client for the Appz Budget API, built with the Charmbracelet stack:
- **Bubble Tea** - Elm-architecture TUI framework (event loop, messages, commands)
- **Lip Gloss** - Terminal styling (colors, borders, layouts)
- **Bubbles** - Pre-built UI components (text inputs, tables)

### Application Flow

```
main.go → App (app.go) → LoginModel or MainModel
                              ↓
                    Tab Views: SummaryView, ExpenseView,
                              IncomeView, SettingsView
```

### Key Patterns

**State Machine**: `App` manages two states (`StateLogin`, `StateMain`). Each state has its own model that handles `Update()` and `View()`.

**Message-Driven Updates**: All async operations (API calls) return `tea.Cmd` functions that produce messages. Views handle these messages in their `Update()` methods:
- `SummaryDataMsg`, `SummaryErrorMsg` for summary loading
- `ExpensesDataMsg`, `ExpenseErrorMsg` for expenses
- `LoginSuccessMsg`, `LogoutMsg` for auth state

**API Client Pattern**: `internal/api/client.go` wraps all REST API calls. Methods return models and errors, handling JSON serialization internally.

**Styling**: All colors and styles are centralized in `internal/ui/styles.go`. Uses semantic color naming (`ColorPrimary`, `ColorSuccess`, `ColorDanger`) and pre-defined style objects.

### Configuration

Config loads from (in order of precedence):
1. Environment variables (`BUDGET_API_URL`, `BUDGET_API_KEY`)
2. Config file (`~/.config/appz-budget-tui/config` on Unix)
3. Default values

Version is read from `../VERSION` file relative to the tui directory.
