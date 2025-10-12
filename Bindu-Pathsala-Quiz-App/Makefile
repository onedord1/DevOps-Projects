.PHONY: help dev build up down clean test migrate-up migrate-down logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Database is ready!"
	@echo ""
	@echo "Run 'cd backend && go run main.go' in one terminal"
	@echo "Run 'cd frontend && npm run dev' in another terminal"

build: ## Build Docker images
	@echo "Building Docker images..."
	docker-compose build

up: ## Start all services with Docker
	@echo "Starting all services..."
	docker-compose up -d
	@echo ""
	@echo "Services started successfully!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:8080"
	@echo ""
	@echo "Demo credentials:"
	@echo "Admin: ADMIN001 / admin123"
	@echo "Student: STU001 / student123"

down: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down

clean: ## Stop services and remove volumes
	@echo "Stopping services and removing volumes..."
	docker-compose down -v
	@echo "Cleaned up successfully!"

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-db: ## View database logs
	docker-compose logs -f db

test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && go test ./...
	@echo ""
	@echo "Backend tests completed!"

test-backend: ## Run backend tests
	cd backend && go test -v ./...

install-backend: ## Install backend dependencies
	cd backend && go mod download

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

setup: install-backend install-frontend ## Install all dependencies
	@echo "All dependencies installed!"

db-shell: ## Connect to PostgreSQL database
	docker exec -it quiz-db psql -U postgres -d quiz_hosting

restart: down up ## Restart all services

status: ## Show status of services
	docker-compose ps

migrate-create: ## Create a new migration file (usage: make migrate-create name=migration_name)
	@if [ -z "$(name)" ]; then \
		echo "Error: Please provide migration name. Usage: make migrate-create name=migration_name"; \
	else \
		@echo "Creating migration: $(name)"; \
		touch backend/migrations/$(shell date +%s)_$(name).up.sql; \
		touch backend/migrations/$(shell date +%s)_$(name).down.sql; \
		echo "Migration files created in backend/migrations/"; \
	fi

prod-build: ## Build for production
	@echo "Building for production..."
	docker-compose -f docker-compose.yml build --no-cache

prod-up: ## Start production environment
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml up -d

backup-db: ## Backup database
	@echo "Backing up database..."
	docker exec quiz-db pg_dump -U postgres quiz_hosting > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backed up successfully!"

restore-db: ## Restore database (usage: make restore-db file=backup_file.sql)
	@if [ -z "$(file)" ]; then \
		echo "Error: Please provide backup file. Usage: make restore-db file=backup_file.sql"; \
	else \
		echo "Restoring database from $(file)..."; \
		docker exec -i quiz-db psql -U postgres quiz_hosting < $(file); \
		echo "Database restored successfully!"; \
	fi
