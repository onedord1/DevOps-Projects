package main

import (
    "log"

    "github.com/your-org/monitoring-dashboard/internal/common/config"
    "github.com/your-org/monitoring-dashboard/internal/notification-service"
    "github.com/your-org/monitoring-dashboard/pkg/database"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

func main() {
    cfg, _ := config.LoadConfig("configs/local")

    db, err := database.NewPostgresDB(cfg.Database.URL)
    if err != nil { log.Fatalf("Failed to connect to database: %v", err) }
    defer db.Close()

    eventBus, err := events.NewNATSEventBus(cfg.NATS.URL)
    if err != nil { log.Fatalf("Failed to connect to NATS: %v", err) }
    defer eventBus.Close()

    server := notification_service.NewServer(db, eventBus)
    if err := server.Start(":" + cfg.Server.Port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}