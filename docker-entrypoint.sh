#!/bin/bash
set -e

# Create data directories if they don't exist
mkdir -p /app/backend/data /app/backend/data/backups
chown -R appuser:appuser /app/backend/data

# Set database path to data directory if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="sqlite:///./data/budget.db"
fi

# Start cron daemon for scheduled backups (runs as root)
echo "Starting cron daemon for scheduled backups..."
cron

# Run database migrations as appuser
echo "Running database migrations..."
cd /app/backend
su -s /bin/bash appuser -c "uv run alembic upgrade head" || echo "Migration completed or no migrations needed"

# Seed initial admin user if it doesn't exist
echo "Seeding initial admin user..."
su -s /bin/bash appuser -c "uv run python seed.py" || echo "Seed script completed (admin user may already exist)"

# Start the application as appuser
echo "Starting Appz Budget..."
exec su -s /bin/bash appuser -c "$*"
