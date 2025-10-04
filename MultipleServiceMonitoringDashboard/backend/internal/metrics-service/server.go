package metrics_service

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/metrics-service/handler"
	"github.com/your-org/monitoring-dashboard/internal/metrics-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/metrics-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/database"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, eventBus events.EventBus) *Server {
	router := gin.Default()

	// Initialize layers
	metricRepo := repository.NewMetricRepository(db.Pool)
	metricSvc := service.NewMetricService(metricRepo)
	metricHandler := handler.NewMetricHandler(metricSvc)

	// Start the event listener in a goroutine
	go service.StartEventListener(eventBus, metricRepo)

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })
		metrics := v1.Group("/metrics")
		{
			metrics.GET("/raw", metricHandler.GetRawMetrics)
			metrics.GET("/aggregate", metricHandler.GetAggregatedMetrics)
		}
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
