.PHONY: help install dev backend frontend backend-dev frontend-dev test clean migrate verify version tui tui-build tui-run tui-clean tui-test tui-lint tui-fmt

# Default API key for development
DEFAULT_API_KEY ?= your-secret-api-key-change-this

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && uv sync
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing TUI dependencies..."
	cd tui && make install
	@echo "Done!"

dev: ## Start both backend and frontend in development mode
	@echo "Starting development environment..."
	@echo "Using default API key: $(DEFAULT_API_KEY) (set API_KEY and VITE_API_KEY to override)"
	@export API_KEY=$${API_KEY:-$(DEFAULT_API_KEY)} && \
	 export VITE_API_KEY=$${VITE_API_KEY:-$(DEFAULT_API_KEY)} && \
	 $(MAKE) -j2 backend-dev frontend-dev

backend-dev:
	@export API_KEY=$${API_KEY:-$(DEFAULT_API_KEY)} && \
	 export ENV=development && \
	 $(MAKE) backend

frontend-dev:
	@export VITE_API_KEY=$${VITE_API_KEY:-$(DEFAULT_API_KEY)} && $(MAKE) frontend

backend: ## Start backend server (with hot reload in dev mode)
	@echo "Starting backend..."
	@cd backend && \
		uv sync && \
		uv run alembic upgrade head && \
		if [ "$${ENV:-production}" = "development" ]; then \
			echo "Starting with hot reload enabled..."; \
			API_KEY=$${API_KEY:-$(DEFAULT_API_KEY)} \
			ENV=development \
			uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload; \
		else \
			echo "Starting in production mode (no hot reload)..."; \
			API_KEY=$${API_KEY:-$(DEFAULT_API_KEY)} \
			ENV=production \
			uv run uvicorn main:app --host 0.0.0.0 --port 8000; \
		fi

frontend: ## Start frontend development server
	@echo "Starting frontend..."
	@cd frontend && VITE_API_KEY=$${VITE_API_KEY:-$(DEFAULT_API_KEY)} npm run dev

test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && uv run pytest tests/ -v
	@echo "Running frontend lint..."
	cd frontend && npm run lint || true

test-backend: ## Run backend tests only
	cd backend && uv sync --extra test && uv run pytest tests/ -v

test-frontend: ## Run frontend tests only
	cd frontend && npm run test:run

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

lint-frontend-fix: ## Lint and fix frontend code
	cd frontend && npm run lint:fix

type-check-frontend: ## Type check frontend code
	cd frontend && npm run type-check

format-frontend: ## Format frontend code
	cd frontend && npm run format

format-frontend-check: ## Check frontend code formatting
	cd frontend && npm run format:check

lint-backend: ## Lint backend code
	cd backend && uv sync --extra dev && uv run ruff check .

lint-backend-fix: ## Lint and fix backend code
	cd backend && uv sync --extra dev && uv run ruff check --fix .

format-backend: ## Format backend code
	cd backend && uv sync --extra dev && uv run black . && uv run ruff format .

format-backend-check: ## Check backend code formatting
	cd backend && uv sync --extra dev && uv run black --check . && uv run ruff format --check .

migrate: ## Run database migrations
	cd backend && uv run alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MESSAGE="migration message")
	cd backend && uv run alembic revision --autogenerate -m "$(MESSAGE)"

seed: ## Seed initial admin user (admin@email.com / admin)
	cd backend && uv run python seed.py

clean: ## Clean build artifacts and caches
	@echo "Cleaning..."
	rm -rf backend/__pycache__ backend/**/__pycache__ backend/.pytest_cache backend/htmlcov
	rm -rf frontend/node_modules frontend/dist frontend/.vite
	rm -rf mobile/node_modules mobile/.expo mobile/.vite
	rm -f backend/budget.db backend/test.db
	@$(MAKE) tui-clean
	@echo "Done!"

build: ## Build frontend for production
	cd frontend && npm run build

tui: ## Build TUI binary
	cd tui && make build

tui-build: ## Build TUI binary
	cd tui && make build

tui-build-all: ## Build TUI for all platforms
	cd tui && make build-all

tui-run: ## Run TUI application
	cd tui && make run

tui-clean: ## Clean TUI build artifacts
	cd tui && make clean

tui-test: ## Run TUI tests
	cd tui && make test

tui-lint: ## Lint TUI code
	cd tui && make lint

tui-fmt: ## Format TUI code
	cd tui && make fmt

tui-fmt-check: ## Check TUI code formatting
	cd tui && make fmt-check

tui-vet: ## Run go vet on TUI code
	cd tui && make vet

tui-check: ## Run all TUI checks (fmt-check, vet, lint)
	cd tui && make check

docker-build: ## Build Docker image
	docker build -t budget-manager:latest .

docker-run: ## Run Docker container
	docker run -p 8000:8000 -e API_KEY=$${API_KEY:-your-secret-api-key} budget-manager:latest

version: ## Update version and create git tag (usage: make version VERSION="1.0.1")
	@if [ -z "$(VERSION)" ]; then \
		echo "❌ Error: VERSION is required. Usage: make version VERSION=\"1.0.1\""; \
		exit 1; \
	fi
	@echo "Updating version to $(VERSION)..."
	@echo "$(VERSION)" > VERSION
	@echo "Syncing version to mobile..."
	@echo "// Version is read from VERSION file at build time" > mobile/src/utils/version.ts
	@echo "// This file is auto-generated by Makefile version target" >> mobile/src/utils/version.ts
	@echo "// Do not edit manually" >> mobile/src/utils/version.ts
	@echo "" >> mobile/src/utils/version.ts
	@echo "export const APP_VERSION = \"$(VERSION)\";" >> mobile/src/utils/version.ts
	@echo "" >> mobile/src/utils/version.ts
	@echo "// Function to get version from backend health endpoint" >> mobile/src/utils/version.ts
	@echo "export const getVersionFromBackend = async (apiBaseUrl: string): Promise<string | null> => {" >> mobile/src/utils/version.ts
	@echo "  try {" >> mobile/src/utils/version.ts
	@echo "    const response = await fetch(\`\$${apiBaseUrl}/api/v1/health\`);" >> mobile/src/utils/version.ts
	@echo "    if (response.ok) {" >> mobile/src/utils/version.ts
	@echo "      const data = await response.json();" >> mobile/src/utils/version.ts
	@echo "      return data.version || null;" >> mobile/src/utils/version.ts
	@echo "    }" >> mobile/src/utils/version.ts
	@echo "  } catch (error) {" >> mobile/src/utils/version.ts
	@echo "    console.error(\"Failed to fetch version from backend:\", error);" >> mobile/src/utils/version.ts
	@echo "  }" >> mobile/src/utils/version.ts
	@echo "  return null;" >> mobile/src/utils/version.ts
	@echo "};" >> mobile/src/utils/version.ts
	@echo "✅ Synced version $(VERSION) to mobile/src/utils/version.ts"
	@echo "Version updated to $(VERSION)"
	@echo "Creating git tag v$(VERSION)..."
	@git add VERSION mobile/src/utils/version.ts
	@git commit -m "Bump version to $(VERSION)" || true
	@git tag -a "v$(VERSION)" -m "Version $(VERSION)" || (echo "⚠️  Tag v$(VERSION) already exists. Skipping tag creation." && exit 0)
	@echo "✅ Version updated to $(VERSION) and tag v$(VERSION) created"
	@echo "Pushing commit..."
	@git push || (echo "⚠️  Failed to push commit. Make sure you have a remote configured." && exit 1)
	@echo "Pushing tags..."
	@git push --tags || (echo "⚠️  Failed to push tags. Make sure you have a remote configured." && exit 1)
	@echo "✅ Version $(VERSION) pushed and tag v$(VERSION) pushed"

verify: ## Run all linting, type checking, formatting checks, and tests
	@echo "=========================================="
	@echo "Running comprehensive verification..."
	@echo "=========================================="
	@echo ""
	@echo "1. Backend: Checking formatting..."
	@$(MAKE) format-backend-check || (echo "❌ Backend formatting check failed" && exit 1)
	@echo "✅ Backend formatting OK"
	@echo ""
	@echo "2. Backend: Linting..."
	@$(MAKE) lint-backend || (echo "❌ Backend linting failed" && exit 1)
	@echo "✅ Backend linting OK"
	@echo ""
	@echo "3. Backend: Running tests..."
	@$(MAKE) test-backend || (echo "❌ Backend tests failed" && exit 1)
	@echo "✅ Backend tests passed"
	@echo ""
	@echo "4. Frontend: Checking formatting..."
	@$(MAKE) format-frontend-check || (echo "❌ Frontend formatting check failed" && exit 1)
	@echo "✅ Frontend formatting OK"
	@echo ""
	@echo "5. Frontend: Linting..."
	@$(MAKE) lint-frontend || (echo "❌ Frontend linting failed" && exit 1)
	@echo "✅ Frontend linting OK"
	@echo ""
	@echo "6. Frontend: Type checking..."
	@$(MAKE) type-check-frontend || (echo "❌ Frontend type checking failed" && exit 1)
	@echo "✅ Frontend type checking OK"
	@echo ""
	@echo "7. Frontend: Running tests..."
	@$(MAKE) test-frontend || (echo "❌ Frontend tests failed" && exit 1)
	@echo "✅ Frontend tests passed"
	@echo ""
	@echo "8. TUI: Checking formatting..."
	@$(MAKE) tui-fmt-check || (echo "❌ TUI formatting check failed" && exit 1)
	@echo "✅ TUI formatting OK"
	@echo ""
	@echo "9. TUI: Linting..."
	@cd tui && GOLANGCI_LINT=$$(command -v golangci-lint 2>/dev/null || \
		([ -f "$$HOME/go/bin/golangci-lint" ] && echo "$$HOME/go/bin/golangci-lint") || \
		([ -n "$$GOPATH" ] && [ -f "$$GOPATH/bin/golangci-lint" ] && echo "$$GOPATH/bin/golangci-lint") || \
		""); \
	if [ -z "$$GOLANGCI_LINT" ]; then \
		echo "⚠️  golangci-lint not found. Installing..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
		GOLANGCI_LINT=$$(command -v golangci-lint 2>/dev/null || \
			([ -f "$$HOME/go/bin/golangci-lint" ] && echo "$$HOME/go/bin/golangci-lint") || \
			([ -n "$$GOPATH" ] && [ -f "$$GOPATH/bin/golangci-lint" ] && echo "$$GOPATH/bin/golangci-lint") || \
			""); \
	fi; \
	if [ -z "$$GOLANGCI_LINT" ]; then \
		echo "❌ Failed to find or install golangci-lint"; \
		exit 1; \
	fi; \
	$$GOLANGCI_LINT run --out-format=colored-line-number ./... || (echo "❌ TUI linting failed" && exit 1)
	@echo "✅ TUI linting OK"
	@echo ""
	@echo "10. TUI: Running tests..."
	@$(MAKE) tui-test || (echo "❌ TUI tests failed" && exit 1)
	@echo "✅ TUI tests passed"
	@echo ""
	@echo "=========================================="
	@echo "✅ All checks passed!"
	@echo "=========================================="

