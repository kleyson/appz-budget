#!/bin/bash
set -e

# Create data directory if it doesn't exist
mkdir -p /app/backend/data

# Set database path to data directory if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="sqlite:///./data/budget.db"
fi

# Run database migrations
echo "Running database migrations..."
cd /app/backend
uv run alembic upgrade head || echo "Migration completed or no migrations needed"

# Seed initial admin user if it doesn't exist
echo "Seeding initial admin user..."
uv run python seed.py || echo "Seed script completed (admin user may already exist)"

# Start the application
echo "Starting Appz Budget..."
exec "$@"
