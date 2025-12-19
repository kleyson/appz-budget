"""FastAPI backend for budget management application"""

import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from controllers import (
    auth_router,
    backup_router,
    category_router,
    expense_router,
    health_router,
    import_router,
    income_router,
    income_type_router,
    month_router,
    period_router,
    summary_router,
)
from utils.html_injector import load_and_inject_api_key

# Note: Database tables are created via Alembic migrations
# Run 'alembic upgrade head' to apply migrations

app = FastAPI(title="Appz Budget API", version="1.0.0")

# CORS middleware

# Default to production unless explicitly set to development
# In production, frontend is served from the same origin, so CORS is not needed
# But we allow all origins to handle edge cases
# In development, allow localhost origins for Vite dev server
env = os.getenv("ENV", "production").lower()
if env == "development":
    allow_origins = ["http://localhost:3000", "http://localhost:5173"]
else:
    # In production, frontend is served from backend, so same-origin
    # But allow all origins for flexibility
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (must be before static file serving)
app.include_router(health_router)  # Health check - no auth required
app.include_router(auth_router)
app.include_router(backup_router)
app.include_router(expense_router)
app.include_router(income_router)
app.include_router(income_type_router)
app.include_router(category_router)
app.include_router(period_router)
app.include_router(import_router)
app.include_router(month_router)
app.include_router(summary_router)

# Serve static files (frontend build) in production
public_dir = Path(__file__).parent / "public"
if public_dir.exists():
    # Mount public folder for all static assets (JS, CSS, favicons, images, etc.)
    # Everything that is not API should be served from /public/
    app.mount("/public", StaticFiles(directory=public_dir), name="public")

    @app.get("/")
    def root():
        """Serve frontend index.html with runtime API key injection"""
        index_path = public_dir / "index.html"
        if index_path.exists():
            html_content = load_and_inject_api_key(index_path)
            return HTMLResponse(content=html_content)
        return {"message": "Appz Budget API"}

    # Catch-all for frontend routes (must be last, but won't match API routes)
    # FastAPI matches more specific routes first, so API routes are handled before this
    @app.get("/{path:path}")
    def serve_frontend(path: str):
        """Serve frontend routes (SPA fallback)"""
        # Explicitly exclude API routes, docs, openapi, and public assets
        # FastAPI should handle these first, but this is a safety check
        if (
            path.startswith("api/")
            or path.startswith("docs")
            or path.startswith("redoc")
            or path.startswith("openapi")
            or path.startswith("public/")
        ):
            raise HTTPException(status_code=404, detail="Not found")

        # Serve index.html for frontend routes with runtime API key injection
        index_path = public_dir / "index.html"
        if index_path.exists():
            html_content = load_and_inject_api_key(index_path)
            return HTMLResponse(content=html_content)
        raise HTTPException(status_code=404, detail="Not found")

else:

    @app.get("/")
    def root():
        return {"message": "Appz Budget API"}


if __name__ == "__main__":
    # Default to production mode unless explicitly set to development
    # For development, use --reload flag when running via uvicorn CLI
    # Production should use: uvicorn main:app --host 0.0.0.0 --port 8000
    # Hot reload is enabled via Makefile for dev mode only
    import os

    env = os.getenv("ENV", "production").lower()
    reload = env == "development"
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=reload)
