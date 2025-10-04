package healthcheck_service

import (
    "encoding/json"
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/nats-io/nats.go"

    "github.com/your-org/monitoring-dashboard/internal/healthcheck-service/handler"
    "github.com/your-org/monitoring-dashboard/internal/healthcheck-service/repository"
    "github.com/your-org/monitoring-dashboard/internal/healthcheck-service/service"
    "github.com/your-org/monitoring-dashboard/pkg/database"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
    router    *gin.Engine
    scheduler *service.Scheduler
}

func NewServer(db *database.PostgresDB, eventBus events.EventBus) *Server {
    router := gin.Default()

    // Initialize layers
    probeRepo := repository.NewProbeResultRepository(db.Pool)
    monitorCache := service.NewMonitorCache()
    scheduler := service.NewScheduler(monitorCache, probeRepo, eventBus)

    // Start event listener
    go listenForConfigEvents(eventBus, scheduler)

    // Setup routes
    probeHandler := handler.NewProbeHandler(probeRepo)
    v1 := router.Group("/api/v1")
    {
        v1.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })
        v1.GET("/probes", probeHandler.GetRecentResults)
    }

    return &Server{router: router, scheduler: scheduler}
}

func (s *Server) Start(port string) error {
    return s.router.Run(port)
}

// listenForConfigEvents subscribes to config changes and tells the scheduler to handle them.
func listenForConfigEvents(bus events.EventBus, scheduler *service.Scheduler) {
    bus.Subscribe("config.changed", func(msg *nats.Msg) {
        var event map[string]interface{}
        if err := json.Unmarshal(msg.Data, &event); err != nil {
            log.Printf("Failed to unmarshal config event: %v", err)
            return
        }
        scheduler.HandleConfigEvent(event)
    })
}