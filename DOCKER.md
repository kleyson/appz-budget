# Docker Setup Guide

This guide explains how to build and run Appz Budget using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd appz-budget
   ```

2. **Create a `.env` file (optional):**

   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Start the application:**

   ```bash
   docker-compose up -d
   ```

4. **View logs:**

   ```bash
   docker-compose logs -f
   ```

5. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**

   ```bash
   docker build -t appz-budget:latest --build-arg VITE_API_KEY=your-api-key .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name appz-budget \
     -p 8000:8000 \
     -e API_KEY=your-secret-api-key \
     -e DATABASE_URL=sqlite:///./data/budget.db \
     -v appz-budget-data:/app/backend/data \
     appz-budget:latest
   ```

## Image Optimization

The Dockerfile uses a multi-stage build process to minimize the final image size:

1. **Frontend Builder Stage**: Uses `node:22-alpine` to build the React frontend
2. **Backend Builder Stage**: Uses `python:3.12-slim` to install Python dependencies
3. **Final Stage**: Minimal runtime image with only necessary files

### Image Size

The final image is optimized for size:

- Base: `python:3.12-slim` (~150MB)
- With dependencies: ~300-400MB
- Total size: ~400-500MB

## Environment Variables

| Variable       | Description                               | Default                           |
| -------------- | ----------------------------------------- | --------------------------------- |
| `API_KEY`      | Secret API key for backend authentication | `your-secret-api-key-change-this` |
| `VITE_API_KEY` | API key for frontend (build-time)         | `your-secret-api-key-change-this` |
| `DATABASE_URL` | Database connection string                | `sqlite:///./data/budget.db`      |
| `PORT`         | Port to expose                            | `8000`                            |
| `ENV`          | Environment mode                          | `production`                      |

## Data Persistence

The application uses Docker volumes to persist data:

- **Volume name**: `budget-data`
- **Mount point**: `/app/backend/data`
- **Database file**: `budget.db`

To backup your data:

```bash
docker run --rm -v appz-budget_budget-data:/data -v $(pwd):/backup alpine tar czf /backup/budget-backup.tar.gz /data
```

To restore:

```bash
docker run --rm -v appz-budget_budget-data:/data -v $(pwd):/backup alpine tar xzf /backup/budget-backup.tar.gz -C /
```

## Security

- The container runs as a non-root user (`appuser`, UID 1000)
- Only necessary ports are exposed
- Health checks are configured
- Environment variables should be set securely

## Troubleshooting

### Container won't start

Check logs:

```bash
docker-compose logs budget-app
```

### Database migration errors

The entrypoint script handles migrations automatically. If you need to run them manually:

```bash
docker-compose exec budget-app uv run alembic upgrade head
```

### Permission errors

If you encounter permission errors, ensure the data volume has correct permissions:

```bash
docker-compose exec budget-app chown -R appuser:appuser /app/backend/data
```

### Port already in use

Change the port in `docker-compose.yml`:

```yaml
ports:
  - "8080:8000" # Use port 8080 instead of 8000
```

## Production Deployment

For production deployment:

1. **Set strong API keys** in environment variables
2. **Use a reverse proxy** (nginx, Traefik, etc.) for SSL/TLS
3. **Configure backups** for the database volume
4. **Monitor logs** and health checks
5. **Use Docker secrets** or environment variable management tools

## Building for Different Architectures

To build for ARM64 (Apple Silicon, Raspberry Pi):

```bash
docker buildx build --platform linux/arm64 -t appz-budget:latest .
```

To build for multiple architectures:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t appz-budget:latest .
```
