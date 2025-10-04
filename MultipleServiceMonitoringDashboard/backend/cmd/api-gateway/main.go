package main

import (
    "log"
    "net/http"

    "github.com/gorilla/websocket"
    "github.com/gin-gonic/gin"

    api_gateway "github.com/your-org/monitoring-dashboard/internal/api-gateway"
    "github.com/your-org/monitoring-dashboard/internal/common/config"
)

func main() {
    // Load configuration
    cfg, err := config.LoadConfig("configs/local")
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Create the Gin router
    router := api_gateway.NewServer(cfg)

    // Create a WebSocket handler that wraps the Gin router
    // This handler will check for WebSocket upgrade requests and handle them.
    // All other requests will be passed to the Gin router.
    wsHandler := websocket.Handler(router)

    // Create the server, using the WebSocket handler
    server := &http.Server{
        Addr:    ":" + cfg.Server.Port,
        Handler: wsHandler,
    }

    // Start the server in a goroutine
    go func() {
        log.Printf("Starting server on %s\n", server.Addr)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    // The main goroutine can just wait here, or you could add graceful shutdown logic
    select {}
}