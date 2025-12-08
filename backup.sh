#!/bin/bash
# Database backup script for Appz Budget
# Creates daily backups of the SQLite database
#
# Retention policy:
# - Keep all backups from the last 7 days
# - For older backups, keep only 1 per month (last backup of each month)

set -e

BACKUP_DIR="/app/backend/data/backups"
DB_PATH="/app/backend/data/budget.db"
KEEP_DAYS=7  # Keep all backups from the last 7 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Only backup if database exists
if [ -f "$DB_PATH" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/budget_backup_$TIMESTAMP.db"

    # Create backup using SQLite's backup command for consistency
    sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

    # Compress the backup
    gzip "$BACKUP_FILE"

    echo "$(date): Backup created: ${BACKUP_FILE}.gz"

    # Cleanup old backups
    cleanup_backups() {
        cd "$BACKUP_DIR"

        # Get the cutoff date (7 days ago)
        CUTOFF_DATE=$(date -d "$KEEP_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${KEEP_DAYS}d +%Y%m%d)

        echo "$(date): Cleanup - keeping all backups after $CUTOFF_DATE"

        # Track which months we've already kept a backup for (older than 7 days)
        declare -A kept_months

        # Process backups from newest to oldest
        for backup in $(ls -t budget_backup_*.gz 2>/dev/null); do
            # Extract date from filename (budget_backup_YYYYMMDD_HHMMSS.db.gz)
            backup_date=$(echo "$backup" | sed -n 's/budget_backup_\([0-9]\{8\}\)_.*/\1/p')

            if [ -z "$backup_date" ]; then
                continue
            fi

            # If backup is within the last 7 days, keep it
            if [ "$backup_date" -ge "$CUTOFF_DATE" ]; then
                echo "$(date): Keeping recent backup: $backup"
                continue
            fi

            # For older backups, keep only one per month
            backup_month="${backup_date:0:6}"  # YYYYMM

            if [ -z "${kept_months[$backup_month]}" ]; then
                # First (newest) backup of this month - keep it
                kept_months[$backup_month]=1
                echo "$(date): Keeping monthly backup for $backup_month: $backup"
            else
                # Already have a backup for this month - delete this one
                echo "$(date): Removing old backup: $backup"
                rm -f "$backup"
            fi
        done
    }

    cleanup_backups

    echo "$(date): Cleanup complete."
else
    echo "$(date): Database not found at $DB_PATH, skipping backup"
fi
