# Appz Budget TUI

A Terminal User Interface for Appz Budget, built with [Bubble Tea](https://github.com/charmbracelet/bubbletea) and [Lip Gloss](https://github.com/charmbracelet/lipgloss).

## Features

- 🔐 **Authentication** - Secure login with JWT tokens
- 📊 **Summary Dashboard** - Overview of budget with income/expense totals and category breakdowns
- 💰 **Expense Management** - Create, edit, delete, and filter expenses
- 💵 **Income Management** - Track all income sources with CRUD operations
- ⚙️ **Settings** - Manage categories, periods, income types, and change password
- 👥 **User Management** - Admin users can manage other users
- 📅 **Month Navigation** - Easily switch between budget months

## Screenshot

```
    ____            __           __
   / __ )__  ______/ /___ ____  / /_
  / __  / / / / __  / __ '/ _ \/ __/
 / /_/ / /_/ / /_/ / /_/ /  __/ /_
/_____/\__,_/\__,_/\__, /\___/\__/
                  /____/

💰 Appz Budget                                    👤 user@example.com

 1 📊 Summary   2 💰 Expenses   3 💵 Income   4 ⚙️ Settings

📅 November 2025  [ ← previous | next → ]
───────────────────────────────────────────────────────────────

╭─────────────────────────────────────────────────────────────╮
│  💵 Income          💰 Expenses         📊 Balance          │
│  $5,000.00          $3,200.00           $1,800.00           │
│  / $5,000 budgeted  / $4,000 budgeted   / $1,000 budgeted   │
│  ████████████████   ████████████░░░░    ████████████████    │
│  Goal Met! 100%     On Track 80%        ✓ Above target      │
╰─────────────────────────────────────────────────────────────╯
```

## Installation

### Prerequisites

- Go 1.22 or later (for building from source)
- A running Appz Budget backend server

### Download Pre-built Binary

Download the latest release from [GitHub Releases](https://github.com/appz/budget/releases).

#### Linux (AMD64)

```bash
wget -O - https://github.com/appz/budget/releases/latest/download/budget-tui-linux-amd64.tar.gz | tar -xz && sudo mv budget-tui-linux-amd64 /usr/local/bin/budget-tui && sudo chmod +x /usr/local/bin/budget-tui
```

#### Linux (ARM64)

```bash
wget -O - https://github.com/appz/budget/releases/latest/download/budget-tui-linux-arm64.tar.gz | tar -xz && sudo mv budget-tui-linux-arm64 /usr/local/bin/budget-tui && sudo chmod +x /usr/local/bin/budget-tui
```

#### macOS (AMD64 / Intel)

```bash
wget -O - https://github.com/appz/budget/releases/latest/download/budget-tui-darwin-amd64.tar.gz | tar -xz && sudo mv budget-tui-darwin-amd64 /usr/local/bin/budget-tui && sudo chmod +x /usr/local/bin/budget-tui
```

#### macOS (ARM64 / Apple Silicon)

```bash
wget -O - https://github.com/appz/budget/releases/latest/download/budget-tui-darwin-arm64.tar.gz | tar -xz && sudo mv budget-tui-darwin-arm64 /usr/local/bin/budget-tui && sudo chmod +x /usr/local/bin/budget-tui
```

**Note:** If you prefer user-specific installation (no sudo), replace `/usr/local/bin` with `~/.local/bin` (Linux) or ensure `~/.local/bin` is in your PATH.

### Build from Source

```bash
cd tui
go build -o budget-tui .
```

### Run

```bash
# Run with default production API (https://budget.appz.wtf)
./budget-tui

# Or override with environment variables for local development
export BUDGET_API_URL=http://localhost:8000
export BUDGET_API_KEY=your-api-key
./budget-tui
```

## Configuration

The TUI can be configured via environment variables:

| Variable             | Description                  | Default                           |
| -------------------- | ---------------------------- | --------------------------------- |
| `BUDGET_API_URL`     | Backend API URL              | `https://budget.appz.wtf`         |
| `BUDGET_API_KEY`     | API key for authentication   | `your-secret-api-key-change-this` |
| `BUDGET_CLIENT_INFO` | Client identification string | `TUI/<version>`                   |

The version is automatically read from the `VERSION` file in the project root.

## Keyboard Shortcuts

### Global

| Key            | Action                                                 |
| -------------- | ------------------------------------------------------ |
| `1-4`          | Switch between tabs (Summary/Expenses/Income/Settings) |
| `[` / `]`      | Previous / Next month                                  |
| `r`            | Refresh data                                           |
| `?`            | Toggle help screen                                     |
| `L`            | Logout                                                 |
| `q` / `Ctrl+C` | Quit                                                   |

### Navigation

| Key         | Action                   |
| ----------- | ------------------------ |
| `↑` / `k`   | Move up                  |
| `↓` / `j`   | Move down                |
| `Tab`       | Next field / section     |
| `Shift+Tab` | Previous field / section |
| `Enter`     | Select / Edit            |
| `Esc`       | Cancel / Back            |

### Actions

| Key | Action                             |
| --- | ---------------------------------- |
| `n` | Create new item                    |
| `e` | Edit selected item                 |
| `d` | Delete selected item               |
| `p` | Filter by period                   |
| `g` | Filter by category (expenses only) |

### Forms

| Key       | Action                        |
| --------- | ----------------------------- |
| `←` / `→` | Change selection in dropdowns |
| `Ctrl+S`  | Save form                     |
| `Esc`     | Cancel                        |

## Development

### Project Structure

```
tui/
├── main.go                 # Entry point
├── go.mod                  # Go module definition
├── README.md               # This file
└── internal/
    ├── api/
    │   └── client.go       # API client for backend communication
    ├── config/
    │   └── config.go       # Configuration management
    ├── models/
    │   └── models.go       # Data models
    └── ui/
        ├── app.go          # Main application model
        ├── login.go        # Login screen
        ├── main.go         # Main view after login
        ├── summary.go      # Summary/Dashboard view
        ├── expenses.go     # Expenses management
        ├── income.go       # Income management
        ├── settings.go     # Settings management
        └── styles.go       # UI styles and theme
```

### Running in Development

```bash
# Run directly
go run .

# Or with hot reload using air
air
```

### Building

```bash
# Build for current platform
go build -o budget-tui .

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o budget-tui-linux .

# Build for macOS
GOOS=darwin GOARCH=amd64 go build -o budget-tui-mac .

# Build for Windows
GOOS=windows GOARCH=amd64 go build -o budget-tui.exe .
```

## Theme

The TUI uses a modern dark theme inspired by [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) with the following color palette:

- **Base**: `#1e1e2e` (dark background)
- **Surface**: `#313244` (elevated surfaces)
- **Primary**: `#89b4fa` (blue accents)
- **Success**: `#a6e3a1` (green)
- **Warning**: `#f9e2af` (yellow)
- **Danger**: `#f38ba8` (red)

## License

Same license as the main Appz Budget project.
