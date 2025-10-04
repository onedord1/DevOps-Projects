package config_service

import (
	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/configuration-service/handler"
	"github.com/your-org/monitoring-dashboard/internal/configuration-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/configuration-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/database"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, eventBus events.EventBus) *Server {
	router := gin.Default()

	// Initialize layers
	monitorRepo := repository.NewMonitorRepository(db.Pool)
	monitorSvc := service.NewMonitorService(monitorRepo, eventBus)
	monitorHandler := handler.NewMonitorHandler(monitorSvc)

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		monitors := v1.Group("/monitors")
		{
			monitors.POST("", monitorHandler.Create)
			monitors.GET("", monitorHandler.GetAll)
			monitors.GET("/:id", monitorHandler.GetByID)
			monitors.PUT("/:id", monitorHandler.Update)
			monitors.DELETE("/:id", monitorHandler.Delete)
		}
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
