# Multi-stage build for Appz Budget - Bun backend with frontend

# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy VERSION file first (needed for frontend build)
COPY VERSION ./VERSION

# Copy only package files for better caching
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install dependencies (including dev dependencies needed for build)
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
ARG VITE_API_KEY=""
ENV VITE_API_KEY=${VITE_API_KEY}
RUN npm run build

# Stage 2: Backend with Bun
FROM oven/bun:1 AS base

WORKDIR /app

# Install system dependencies for health check, backups, and cron
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    cron \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy VERSION file for API version endpoint
COPY VERSION ./VERSION

# Install backend dependencies
COPY backend/package.json backend/bun.lock ./backend/
RUN cd backend && bun install --production

# Copy backend source
COPY backend/src ./backend/src
COPY backend/drizzle ./backend/drizzle
COPY backend/drizzle.config.ts ./backend/
COPY backend/tsconfig.json ./backend/

# Copy built frontend. Vite's build.outDir is '../backend/public', so in
# the frontend-builder stage the bundle lands at /app/backend/public —
# not /app/frontend/dist.
COPY --from=frontend-builder /app/backend/public ./backend/public

# Copy startup script and backup script
COPY docker-entrypoint.sh /usr/local/bin/
COPY backup.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/backup.sh

WORKDIR /app/backend

# Create non-root user for security. Recent oven/bun:1 images ship a
# pre-existing `bun` user at UID 1000, so remove it first; keeping UID
# 1000 matters for host-mounted volumes under ./data.
RUN if getent passwd 1000 >/dev/null; then \
      userdel -r "$(getent passwd 1000 | cut -d: -f1)" 2>/dev/null || true; \
    fi && \
    useradd -m -u 1000 appuser && \
    mkdir -p /app/backend/data /app/backend/data/backups && \
    chown -R appuser:appuser /app

# Set up cron job for daily backups (runs at 2 AM as appuser)
RUN echo "0 2 * * * appuser /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron && \
    chmod 0644 /etc/cron.d/backup-cron && \
    crontab -u appuser /etc/cron.d/backup-cron && \
    touch /var/log/backup.log && \
    chown appuser:appuser /var/log/backup.log

# Expose port
EXPOSE 8000

# Environment variables
ENV API_KEY="" \
    DATABASE_URL="file:./data/budget.db"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run entrypoint then start server
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
