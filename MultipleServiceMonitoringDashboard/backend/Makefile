.PHONY: help build run stop deps migrate clean infra-up infra-down
help:
	@echo "Available commands:"
	@echo "  make deps     - Install Go dependencies"
	@echo "  make build    - Build all microservices"
	@echo "  make infra-up - Start infrastructure (Postgres, Redis, NATS)"
	@echo "  make infra-down - Stop and remove infrastructure"
	@echo "  make migrate  - Run database migrations"
	@echo "  make clean    - Clean up build artifacts"
deps:
	@echo "Installing Go dependencies..."
	go mod download
	go mod tidy
build:
	@echo "Building services..."
	go build -o bin/auth-service ./cmd/auth-service
	go build -o bin/configuration-service ./cmd/configuration-service
	go build -o bin/healthcheck-service ./cmd/healthcheck-service
	go build -o bin/metrics-service ./cmd/metrics-service
	go build -o bin/alerting-service ./cmd/alerting-service
	go build -o bin/notification-service ./cmd/notification-service
	go build -o bin/incident-service ./cmd/incident-service
	go build -o bin/api-gateway ./cmd/api-gateway
	@echo "Build complete."
run:
	@echo "Please run each service manually in a separate terminal."
	@echo "See the full startup guide for the commands to use."
stop:
	@echo "Stopping all services..."
	pkill -f "auth-service" || true
	pkill -f "configuration-service" || true
	pkill -f "healthcheck-service" || true
	pkill -f "metrics-service" || true
	pkill -f "alerting-service" || true
	pkill -f "notification-service" || true
	pkill -f "incident-service" || true
	pkill -f "api-gateway" || true
	@echo "All services stopped."
infra-up:
	@echo "Starting infrastructure with Docker Compose..."
	docker-compose up -d
infra-down:
	@echo "Stopping and removing infrastructure..."
	docker-compose down -v
migrate:
	@echo "Running database migrations..."
	migrate -path migrations/auth-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	migrate -path migrations/configuration-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	migrate -path migrations/metrics-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	migrate -path migrations/alerting-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	migrate -path migrations/notification-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	migrate -path migrations/incident-service -database "postgres://postgres:password@localhost:5432/monitoring_db?sslmode=disable" up
	@echo "Migrations complete."
clean:
	rm -rf bin/
