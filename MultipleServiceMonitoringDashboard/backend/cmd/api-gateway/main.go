package main

import (
    "log"

    "github.com/your-org/monitoring-dashboard/internal/api-gateway"
    "github.com/your-org/monitoring-dashboard/internal/common/config"
)

func main() {
    // Load configuration
    cfg, err := config.LoadConfig("configs/local")
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Start server
    server := api_gateway.NewServer(cfg)
    if err := server.Start(":" + cfg.Server.Port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}