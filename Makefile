.PHONY: help install db-up db-down db-reset seed seed-stress backend frontend dev stop test test-e2e clean logs

# Default target - show help
help:
	@echo "Shavtzak Development Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup:"
	@echo "  make install      Install all dependencies (frontend + backend)"
	@echo "  make db-up        Start PostgreSQL database"
	@echo "  make seed         Seed database with sample data"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start everything (database + backend + frontend)"
	@echo "  make backend      Start backend only (port 3000)"
	@echo "  make frontend     Start frontend only (port 5173)"
	@echo "  make stop         Stop all running services"
	@echo ""
	@echo "Database:"
	@echo "  make db-down      Stop database"
	@echo "  make db-reset     Reset database (WARNING: destroys all data)"
	@echo "  make logs         Show database logs"
	@echo ""
	@echo "Testing:"
	@echo "  make test         Run backend tests"
	@echo "  make test-e2e     Run frontend E2E tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        Remove node_modules, dist, build artifacts"
	@echo ""

# Install all dependencies
install:
	@echo "📦 Installing backend dependencies..."
	@cd backend && npm install
	@echo ""
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install
	@echo ""
	@echo "✅ All dependencies installed!"

# Start PostgreSQL database
db-up:
	@echo "🐘 Starting PostgreSQL database..."
	@docker-compose up -d
	@echo "⏳ Waiting for database to be ready..."
	@sleep 3
	@echo "✅ Database is running on port 5432"

# Stop PostgreSQL database
db-down:
	@echo "🛑 Stopping PostgreSQL database..."
	@docker-compose down
	@echo "✅ Database stopped"

# Reset database (destroys all data)
db-reset:
	@echo "⚠️  WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "🔄 Resetting database..."; \
		docker-compose down -v; \
		docker-compose up -d; \
		sleep 3; \
		cd backend && npm run seed; \
		echo "✅ Database reset complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

# Seed database with sample data
seed:
	@echo "🌱 Seeding database..."
	@cd backend && npm run seed
	@echo "✅ Database seeded with 70 soldiers and 3 tasks"

# Seed database with stress scenario data
seed-stress:
	@echo "Seeding database with stress scenario..."
	@cd backend && npm run seed:stress
	@echo "Stress scenario seeded"

# Start backend only
backend:
	@echo "🚀 Starting backend on http://localhost:3000"
	@cd backend && npm run start:dev

# Start frontend only
frontend:
	@echo "🚀 Starting frontend on http://localhost:5173"
	@cd frontend && npm run dev

# Start everything (database + backend + frontend)
dev:
	@echo "🚀 Starting complete development environment..."
	@echo ""
	@echo "Starting services in the background..."
	@docker-compose up -d
	@echo "⏳ Waiting for database..."
	@sleep 3
	@echo ""
	@echo "Starting backend and frontend..."
	@echo "================================"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:5173"
	@echo "API Docs: http://localhost:3000/api/docs"
	@echo "================================"
	@echo ""
	@echo "Press Ctrl+C to stop all services"
	@echo ""
	@trap 'make stop' EXIT; \
	(cd backend && npm run start:dev) & \
	BACKEND_PID=$$!; \
	(cd frontend && npm run dev) & \
	FRONTEND_PID=$$!; \
	wait $$BACKEND_PID $$FRONTEND_PID

# Stop all services
stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down
	@pkill -f "vite" || true
	@pkill -f "nest start" || true
	@pkill -f "tsx" || true
	@echo "✅ All services stopped"

# Show database logs
logs:
	@docker-compose logs -f postgres

# Run backend tests
test:
	@echo "🧪 Running backend tests..."
	@cd backend && npm run test

# Run frontend E2E tests
test-e2e:
	@echo "🧪 Running E2E tests..."
	@echo "⚠️  Make sure backend and database are running!"
	@cd frontend && npm run test:e2e

# Clean all build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf backend/node_modules
	@rm -rf backend/dist
	@rm -rf frontend/node_modules
	@rm -rf frontend/dist
	@rm -rf frontend/test-results
	@rm -rf frontend/playwright-report
	@echo "✅ Cleanup complete"
