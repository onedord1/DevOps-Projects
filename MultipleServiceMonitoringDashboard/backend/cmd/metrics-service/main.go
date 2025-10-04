package main

import (
    "log"

    "github.com/your-org/monitoring-dashboard/internal/common/config"
    "github.com/your-org/monitoring-dashboard/internal/metrics-service"
    "github.com/your-org/monitoring-dashboard/pkg/database"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

func main() {
    // Load configuration
    cfg, err := config.LoadConfig("configs/local")
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Initialize database
    db, err := database.NewPostgresDB(cfg.Database.URL)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()

    // Initialize event bus
    eventBus, err := events.NewNATSEventBus(cfg.NATS.URL)
    if err != nil {
        log.Fatalf("Failed to connect to NATS: %v", err)
    }
    defer eventBus.Close()

    // Start server
    server := metrics_service.NewServer(db, eventBus)
    if err := server.Start(":" + cfg.Server.Port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}