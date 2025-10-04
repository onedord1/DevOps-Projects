package main

import (
    "log"

    "github.com/your-org/monitoring-dashboard/internal/alerting-service"
    "github.com/your-org/monitoring-dashboard/internal/common/config"
    "github.com/your-org/monitoring-dashboard/pkg/cache"
    "github.com/your-org/monitoring-dashboard/pkg/database"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

func main() {
    cfg, _ := config.LoadConfig("configs/local")

    db, err := database.NewPostgresDB(cfg.Database.URL)
    if err != nil { log.Fatalf("Failed to connect to database: %v", err) }
    defer db.Close()

    redisCache, err := cache.NewRedisCache(cfg.Redis.Addr, cfg.Redis.Password, cfg.Redis.DB)
    if err != nil { log.Fatalf("Failed to connect to Redis: %v", err) }
    defer redisCache.Close()

    eventBus, err := events.NewNATSEventBus(cfg.NATS.URL)
    if err != nil { log.Fatalf("Failed to connect to NATS: %v", err) }
    defer eventBus.Close()

    server := alerting_service.NewServer(db, redisCache, eventBus)
    if err := server.Start(":" + cfg.Server.Port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}