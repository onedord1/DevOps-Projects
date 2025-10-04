package incident_service

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/incident-service/handler"
	"github.com/your-org/monitoring-dashboard/internal/incident-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/incident-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/database"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, eventBus events.EventBus) *Server {
	router := gin.Default()

	// Initialize layers
	incidentRepo := repository.NewIncidentRepository(db.Pool)
	incidentSvc := service.NewIncidentService(incidentRepo) // Use the new service
	incidentHandler := handler.NewIncidentHandler(incidentSvc)

	manager := service.NewIncidentManager(incidentRepo, eventBus)
	go manager.StartEventListener()

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })

		incidents := v1.Group("/incidents")
		{
			incidents.POST("", incidentHandler.CreateIncident)
			incidents.GET("", incidentHandler.GetAllIncidents)
			incidents.GET("/:id", incidentHandler.GetIncidentByID)
			incidents.GET("/:id/timeline", incidentHandler.GetTimeline)
			incidents.POST("/:id/resolve", incidentHandler.ResolveIncident)
			incidents.POST("/:id/comment", incidentHandler.AddComment)
		}
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
