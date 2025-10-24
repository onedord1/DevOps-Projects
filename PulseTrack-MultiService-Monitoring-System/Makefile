.PHONY: help setup build up down logs clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup - copy env file
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file. Please update it with your configuration."; \
	else \
		echo ".env file already exists."; \
	fi

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo "Services started. Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API:      http://localhost:8080"

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API Gateway logs
	docker-compose logs -f api-gateway

logs-checker: ## View Checker service logs
	docker-compose logs -f checker

logs-notification: ## View Notification service logs
	docker-compose logs -f notification

logs-frontend: ## View Frontend logs
	docker-compose logs -f frontend

ps: ## List running services
	docker-compose ps

restart: ## Restart all services
	docker-compose restart

restart-api: ## Restart API Gateway
	docker-compose restart api-gateway

restart-checker: ## Restart Checker service
	docker-compose restart checker

restart-notification: ## Restart Notification service
	docker-compose restart notification

restart-frontend: ## Restart Frontend
	docker-compose restart frontend

clean: ## Remove containers and volumes
	docker-compose down -v
	@echo "Cleaned up containers and volumes"

reset: clean setup build up ## Complete reset and restart

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U monitoring monitoring_system

redis-shell: ## Open Redis CLI
	docker-compose exec redis redis-cli

test-backend: ## Run backend tests
	cd backend && cargo test --all

test-frontend: ## Run frontend tests
	cd frontend && npm test

dev-frontend: ## Run frontend in development mode
	cd frontend && npm run dev

dev-backend: ## Run backend services locally (requires Rust)
	@echo "Starting backend services..."
	@echo "Make sure PostgreSQL and Redis are running locally"
	cd backend && cargo run --package api-gateway

check-health: ## Check health of all services
	@echo "Checking API Gateway..."
	@curl -s http://localhost:8080/health | jq . || echo "API Gateway not responding"
	@echo "\nChecking Frontend..."
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Frontend not responding"

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

install-rust: ## Check Rust installation
	@which cargo > /dev/null || (echo "Rust not installed. Visit https://rustup.rs" && exit 1)
	@echo "Rust is installed: $$(rustc --version)"

install-node: ## Check Node.js installation
	@which node > /dev/null || (echo "Node.js not installed. Visit https://nodejs.org" && exit 1)
	@echo "Node.js is installed: $$(node --version)"

setup-dev: install-rust install-node install-frontend ## Setup development environment
	@echo "Development environment ready!"

backup-db: ## Backup database
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U monitoring monitoring_system | gzip > backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "Database backup created in backups/"

restore-db: ## Restore database (set BACKUP_FILE=path/to/backup.sql.gz)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Usage: make restore-db BACKUP_FILE=backups/backup_20231024.sql.gz"; \
		exit 1; \
	fi
	gunzip < $(BACKUP_FILE) | docker-compose exec -T postgres psql -U monitoring monitoring_system

migrate-db: ## Run database migrations
	docker-compose exec postgres psql -U monitoring monitoring_system -f /docker-entrypoint-initdb.d/001_init.sql

stats: ## Show resource usage
	docker stats --no-stream

prune: ## Remove unused Docker resources
	docker system prune -af
	docker volume prune -f

update: ## Pull latest changes and rebuild
	git pull
	make build
	make restart
