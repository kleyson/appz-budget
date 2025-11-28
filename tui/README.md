# Budget TUI

A Terminal User Interface for the Appz Budget application, built with Rust and Ratatui.

## Features

- Login with email/password (JWT authentication)
- Dashboard with 5 tabs: Summary, Expenses, Income, Charts, Settings
- View and manage expenses, income, categories, periods, and income types
- ASCII charts for budget visualization
- Keyboard-driven navigation (vim-style)
- Cross-platform single binary (Linux, macOS, Windows)

## Requirements

- A running Budget backend server (default: http://localhost:8000)
- API key for authentication

## Installation

### From Source

```bash
# Build release binary
cargo build --release

# Binary will be at target/release/budget-tui
```

### Using Make

```bash
# From project root
make tui              # Build release binary
make tui-dev          # Run in development mode
```

## Configuration

On first run, a config file will be created at:
- **Linux**: `~/.config/budget-tui/config.toml`
- **macOS**: `~/Library/Application Support/budget-tui/config.toml`
- **Windows**: `%APPDATA%\budget-tui\config.toml`

Edit this file to configure your server:

```toml
[server]
url = "http://localhost:8000"
api_key = "your-api-key-here"

[auth]
# Token is automatically stored after login
```

## Usage

```bash
./budget-tui
```

### Keyboard Shortcuts

#### Global
| Key | Action |
|-----|--------|
| `q` / `Ctrl+C` | Quit |
| `?` | Show help |
| `Tab` | Next tab |
| `Shift+Tab` | Previous tab |
| `1-5` | Jump to tab |

#### Navigation
| Key | Action |
|-----|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `h` / `←` | Previous month |
| `l` / `→` | Next month |
| `Enter` / `e` | Edit selected item |
| `n` | Create new item |
| `d` | Delete selected item |

#### Forms
| Key | Action |
|-----|--------|
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Enter` | Submit |
| `Esc` | Cancel |

## Cross-Compilation

Build for multiple platforms using [cross](https://github.com/cross-rs/cross):

```bash
# Install cross
cargo install cross

# Build for different targets
make tui-build-linux-x64    # Linux x86_64
make tui-build-linux-arm64  # Linux ARM64
make tui-build-windows      # Windows x86_64
make tui-build-macos-x64    # macOS x86_64 (native only)
make tui-build-macos-arm64  # macOS ARM64 (native only)
```

## Development

```bash
# Run with hot reload
cargo run

# Run tests
cargo test

# Lint
cargo clippy

# Format
cargo fmt
```

## Architecture

```
src/
├── main.rs          # Entry point, terminal setup
├── app.rs           # Main app state and event loop
├── api/             # HTTP API client modules
├── models/          # Data structures
├── state/           # Application state management
├── config/          # Configuration file handling
├── event/           # Terminal event handling
└── ui/              # UI rendering
    ├── login.rs     # Login screen
    ├── dashboard.rs # Main dashboard
    ├── tabs/        # Tab content (summary, expenses, etc.)
    └── components/  # Reusable UI components
```

## License

MIT
