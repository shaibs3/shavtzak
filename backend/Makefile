.PHONY: help run build start dev seed clean install test lint

# Default target
help:
	@echo "Available targets:"
	@echo "  make install    - Install dependencies"
	@echo "  make run        - Run backend in development mode"
	@echo "  make dev        - Same as run (alias)"
	@echo "  make build      - Build the backend"
	@echo "  make start      - Run built backend in production mode"
	@echo "  make seed       - Seed database with initial data"
	@echo "  make db-up      - Start PostgreSQL with docker-compose"
	@echo "  make db-down    - Stop PostgreSQL"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linter"
	@echo "  make clean      - Remove build artifacts"

# Install dependencies
install:
	npm install

# Run in development mode (auto-reload)
run:
	npm run start:dev

# Alias for run
dev: run

# Build the backend
build:
	npm run build

# Run in production mode
start:
	npm run start:prod

# Seed the database
seed:
	npm run seed

# Start PostgreSQL database
db-up:
	docker-compose up -d

# Stop PostgreSQL database
db-down:
	docker-compose down

# Run tests
test:
	npm test

# Run linter
lint:
	npm run lint

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules
