# Multi-stage build for Appz Budget - Optimized for size and performance

# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy only package files for better caching
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install dependencies (including dev dependencies needed for build)
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend (outputs to ../backend/public per vite.config.ts)
# VITE_API_KEY is optional at build time - runtime API key is injected by backend
ARG VITE_API_KEY=""
ENV VITE_API_KEY=${VITE_API_KEY}
RUN npm run build

# Stage 2: Python backend builder
FROM python:3.12-slim AS backend-builder

WORKDIR /app/backend

# Install uv (latest version)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

# Copy dependency files for better caching
COPY backend/pyproject.toml backend/uv.lock* ./

# Install backend dependencies
RUN uv sync --frozen --no-dev

# Copy backend source
COPY backend/ ./

# Stage 3: Final minimal runtime image
FROM python:3.12-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
RUN chmod +x /usr/local/bin/uv

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend static files
COPY --from=frontend-builder /app/backend/public ./backend/public

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/backend

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/backend/data && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Environment variables
# ENV defaults to production if not explicitly set
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    API_KEY="" \
    DATABASE_URL="sqlite:///./budget.db"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run migrations and start server
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
