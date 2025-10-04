package main

import (
    "log"
    "os"

    "github.com/your-org/monitoring-dashboard/internal/auth-service"
    "github.com/your-org/monitoring-dashboard/internal/common/config"
    "github.com/your-org/monitoring-dashboard/pkg/database"
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

    // --- FIX IS HERE ---
    // Get the port from the environment variable, or use a default if it's not set.
    portStr := os.Getenv("SERVER_PORT")
    if portStr == "" {
        portStr = "8001" // Default port for the auth service
    }
    // --- END OF FIX ---

    // Start server
    server := auth_service.NewServer(db, cfg.JWT.Secret)
    if err := server.Start(":" + portStr); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}