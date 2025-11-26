.PHONY: build run clean install test lint fmt fmt-check vet check tools

# Binary name
BINARY=budget-tui

# Build the application
build:
	go build -o $(BINARY) .

# Run the application
run:
	go run .

# Run with custom API URL
run-dev:
	BUDGET_API_URL=http://localhost:8000 go run .

# Install dependencies
install:
	go mod download
	go mod tidy

# Clean build artifacts
clean:
	rm -f $(BINARY)
	rm -f $(BINARY)-*

# Run tests
test:
	go test -v ./...

# Run go vet
vet:
	go vet ./...

# Run linter (install with: make tools)
lint:
	@if ! command -v golangci-lint >/dev/null 2>&1; then \
		echo "❌ golangci-lint is not installed. Please run: make tools"; \
		exit 1; \
	fi
	@golangci-lint run --out-format=colored-line-number ./...

# Format code
fmt:
	go fmt ./...
	@if command -v gofumpt >/dev/null 2>&1; then \
		gofumpt -w .; \
	fi
	@if command -v goimports >/dev/null 2>&1; then \
		goimports -w .; \
	fi

# Check formatting (CI-friendly, fails if not formatted)
fmt-check:
	@test -z "$$(gofmt -l .)" || (echo "Files not formatted:"; gofmt -l .; exit 1)

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	@echo ""
	@echo "Coverage report:"
	go tool cover -func=coverage.out | tail -1

# Run tests with HTML coverage report
test-coverage-html: test-coverage
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report saved to coverage.html"

# Run all checks (format check, vet, lint)
check: fmt-check vet lint

# Install development tools
tools:
	@echo "Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install mvdan.cc/gofumpt@latest
	go install golang.org/x/tools/cmd/goimports@latest
	@echo "Tools installed successfully!"

# Build for all platforms
build-all: clean
	GOOS=linux GOARCH=amd64 go build -o $(BINARY)-linux-amd64 .
	GOOS=linux GOARCH=arm64 go build -o $(BINARY)-linux-arm64 .
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY)-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY)-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build -o $(BINARY)-windows-amd64.exe .

# Install the binary to GOPATH/bin
install-bin: build
	cp $(BINARY) $(GOPATH)/bin/

# Show help
help:
	@echo "Available targets:"
	@echo "  build      - Build the application"
	@echo "  run        - Run the application"
	@echo "  run-dev    - Run with localhost API"
	@echo "  install    - Install Go dependencies"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run tests"
	@echo "  vet        - Run go vet"
	@echo "  lint       - Run golangci-lint (or go vet as fallback)"
	@echo "  fmt        - Format code with gofmt/gofumpt/goimports"
	@echo "  fmt-check  - Check if code is formatted (CI-friendly)"
	@echo "  check      - Run all checks (fmt-check, vet, lint)"
	@echo "  tools      - Install development tools (golangci-lint, gofumpt, goimports)"
	@echo "  build-all  - Build for all platforms"
	@echo "  help       - Show this help"
