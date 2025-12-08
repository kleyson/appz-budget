# Appz Budget 💰

A modern, multi-platform budget management application for tracking expenses and income. Available as a web app, mobile app (iOS/Android), and terminal UI.

## 🚀 Try the Demo

You can try Appz Budget without installing anything:

- **Demo URL**: [https://budget.appz.wtf/](https://budget.appz.wtf/)
- **Demo Credentials**:
  - Email: `admin@email.com`
  - Password: `admin`

> **Note**: The demo is reset periodically. Any data you enter may be lost.

## ✨ Features

### Core Functionality
- 📊 **Monthly Budget Tracking** - Track expenses and income by month with month closing
- 💵 **Income Management** - Manage different income types and sources with budgeted amounts
- 📈 **Visual Analytics** - Interactive charts and summaries for better insights
- 🎨 **Category & Period Management** - Organize expenses with custom categories (with colors) and periods
- 💾 **Backup & Restore** - Export and import your entire budget database
- 📥 **Excel Import** - Import expenses from Excel spreadsheets

### Authentication & Security
- 🔐 **User Authentication** - Secure JWT-based login with password reset
- 📧 **Email Integration** - SMTP support for password reset emails (optional)
- 👥 **User Management** - Admin panel for managing users and viewing password reset requests
- 🔑 **API Key Authentication** - Secure backend API access

### Multi-Platform Support
- 🌐 **Web Application** - Responsive React app with dark mode
- 📱 **Mobile App** - Native iOS and Android apps with biometric authentication
- 💻 **Terminal UI** - Cross-platform Rust-based TUI with vim-style navigation
- 🌙 **Dark Mode** - Built-in dark theme support across all platforms

## Quick Start with Docker

The easiest way to run Appz Budget is using Docker Compose. No need to clone the repository!

### Prerequisites

- Docker and Docker Compose installed
- At least 512MB of available RAM

### Installation

1. **Download the docker-compose.yml file:**

   ```bash
   wget https://raw.githubusercontent.com/kleyson/appz-budget/main/docker-compose.yml
   ```

2. **Create a `.env` file (optional but recommended):**

   ```bash
   cat > .env << EOF
   API_KEY=your-secret-api-key-change-this
   PORT=8000
   DATABASE_URL=sqlite:///./data/budget.db
   EOF
   ```

   **Important:** Change `your-secret-api-key-change-this` to a strong, random API key!

3. **Start the application:**

   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Open your browser to `http://localhost:8000`
   - Default admin credentials (if seeded):
     - Email: `admin@email.com`
     - Password: `admin`

### Environment Variables

You can customize the application using environment variables in a `.env` file or directly in `docker-compose.yml`:

#### Core Configuration (Required)
- `API_KEY` - Secret API key for backend authentication (**required**, change the default!)
- `DATABASE_URL` - Database connection string (default: `sqlite:///./data/budget.db`)
- `PORT` - Port to expose the application (default: `8000`)
- `FRONTEND_URL` - Frontend URL for password reset links (default: `http://localhost:8000`)

#### SMTP Email Configuration (Optional)
Configure these to enable password reset emails. If not configured, reset codes will only appear in Docker logs.

- `SMTP_HOST` - SMTP server hostname (e.g., `smtp.gmail.com`)
- `SMTP_PORT` - SMTP server port (default: `587` for TLS)
- `SMTP_USER` - SMTP username (often your email address)
- `SMTP_PASSWORD` - SMTP password or app-specific password
- `SMTP_FROM` - From email address for outgoing emails
- `SMTP_USE_TLS` - Use TLS encryption (default: `true`)

#### Password Reset Configuration (Optional)
- `RESET_CODE_LENGTH` - Length of the short reset code (default: `6`)
- `RESET_CODE_EXPIRATION_MINUTES` - Code validity duration (default: `30`)
- `RESET_TOKEN_EXPIRATION_HOURS` - Full token validity duration (default: `24`)

**SMTP Examples**: See `.env.example` for Gmail, SendGrid, Mailgun, and AWS SES configurations.

**Without SMTP**: Admin users can view active password reset codes via:
- Admin panel: Settings → Password Resets tab
- Docker logs: `docker logs -f appz-budget`

### Data Persistence

The application uses Docker volumes to persist data:

- Database is stored in the `budget-data` volume
- Data persists across container restarts

### Updating

To update to the latest version:

```bash
docker-compose pull
docker-compose up -d
```

### Stopping the Application

```bash
docker-compose down
```

To also remove the data volume (⚠️ this will delete all your data):

```bash
docker-compose down -v
```

## Manual Installation

For development or manual setup, see [PROJECT_NOTES.md](PROJECT_NOTES.md) for detailed instructions.

## 📱 Mobile App (iOS/Android)

The mobile app provides all web features in a native mobile experience with biometric authentication.

### Installation

1. Install [Expo Go](https://expo.dev/client) on your device
2. Clone the repository and navigate to the mobile directory:
   ```bash
   cd mobile
   npm install
   ```

3. Configure the API URL in `src/api/client.ts`:
   - iOS Simulator: `http://localhost:8000`
   - Android Emulator: `http://10.0.2.2:8000`
   - Physical device: `http://YOUR_COMPUTER_IP:8000`

4. Start the app:
   ```bash
   npm start           # Start Expo dev server
   npm run ios         # Run on iOS
   npm run android     # Run on Android
   ```

### Features
- ✅ Biometric authentication (Face ID, Touch ID, fingerprint)
- ✅ All web features: expenses, income, categories, periods, reports
- ✅ Native mobile UI with smooth animations
- ✅ Dark mode support
- ✅ Offline-ready with React Query caching

For detailed instructions, see [mobile/README.md](mobile/README.md).

## 💻 Terminal UI (TUI)

A keyboard-driven terminal interface built with Rust for power users who prefer the command line.

### Installation

```bash
# Build from source
cd tui
cargo build --release

# Binary will be at tui/target/release/budget-tui
```

Or use Make from project root:
```bash
make tui              # Build release binary
make tui-dev          # Run in development mode
```

### Configuration

On first run, edit the config file at:
- **Linux**: `~/.config/budget-tui/config.toml`
- **macOS**: `~/Library/Application Support/budget-tui/config.toml`
- **Windows**: `%APPDATA%\budget-tui\config.toml`

```toml
[server]
url = "http://localhost:8000"
api_key = "your-api-key-here"
```

### Features
- ⌨️ Vim-style keyboard navigation (`hjkl`, `j/k` for up/down)
- 📊 ASCII charts for budget visualization
- 🚀 Fast, lightweight single binary (~5MB)
- 🔐 JWT authentication with secure token storage
- 📱 5 tabs: Summary, Expenses, Income, Charts, Settings
- 🎨 Cross-platform: Linux, macOS, Windows

### Quick Keyboard Shortcuts
- `q` - Quit
- `Tab` - Next tab
- `1-5` - Jump to tab
- `j/k` - Navigate up/down
- `n` - New item
- `e` - Edit item
- `d` - Delete item

For detailed usage and shortcuts, see [tui/README.md](tui/README.md).

## 🏗️ Architecture

- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **Mobile**: React Native + Expo
- **TUI**: Rust + Ratatui
- **Database**: SQLite (PostgreSQL compatible)
- **State Management**: TanStack Query (React Query)
- **Authentication**: JWT tokens with HTTP-only cookies

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you find this project useful, consider supporting its development:

<a href="https://www.buymeacoffee.com/kleyson" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
