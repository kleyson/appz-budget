#!/bin/bash
set -e

# Create data directories if they don't exist
mkdir -p /app/backend/data /app/backend/data/backups
chown -R bun:bun /app/backend/data

# Set database path to data directory if not already set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./data/budget.db"
fi

# Start cron daemon for scheduled backups (runs as root)
echo "Starting cron daemon for scheduled backups..."
cron

# Push database schema with Drizzle (creates tables if they don't exist)
echo "Pushing database schema..."
cd /app/backend
su -s /bin/bash bun -c "bunx drizzle-kit push" || echo "Schema push completed or no changes needed"

# Start the application as bun
echo "Starting Appz Budget..."
exec su -s /bin/bash bun -c "$*"
