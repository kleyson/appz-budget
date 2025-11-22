# Appz Budget 💰

A modern, self-hosted budget management application for tracking expenses and income.

## 🚀 Try the Demo

You can try Appz Budget without installing anything:

- **Demo URL**: [https://budget.appz.wtf/](https://budget.appz.wtf/)
- **Demo Credentials**:
  - Email: `admin@email.com`
  - Password: `admin`

> **Note**: The demo is reset periodically. Any data you enter may be lost.

## Features

- 📊 **Monthly Budget Tracking** - Track expenses and income by month
- 💵 **Income Management** - Manage different income types and sources
- 📈 **Visual Analytics** - Charts and summaries for better insights
- 🎨 **Category & Period Management** - Organize expenses with custom categories and periods
- 🔐 **User Authentication** - Secure login and user management
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌙 **Dark Mode** - Built-in dark theme support

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

- `API_KEY` - Secret API key for backend authentication (required, change the default!)
- `DATABASE_URL` - Database connection string (default: `sqlite:///./data/budget.db`)
- `PORT` - Port to expose the application (default: `8000`)

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🚧 Next Features

Upcoming features planned for future releases:

- [ ] Add SMTP configuration for forgot password
- [ ] Chat with AI about your finances with BYOAK/Service

## Support

If you find this project useful, consider supporting its development:

<a href="https://www.buymeacoffee.com/kleyson" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
