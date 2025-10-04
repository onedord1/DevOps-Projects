package alerting_service

import (
	"net/http"

	"github.com/gin-gonic/gin"

	alerthdlr "github.com/your-org/monitoring-dashboard/internal/alerting-service/handler" // Use an alias for handler too
	"github.com/your-org/monitoring-dashboard/internal/alerting-service/repository"
	alertsvc "github.com/your-org/monitoring-dashboard/internal/alerting-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/cache"
	"github.com/your-org/monitoring-dashboard/pkg/database"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, redisCache cache.Cache, eventBus events.EventBus) *Server {
	router := gin.Default()

	// Initialize layers
	alertRepo := repository.NewAlertRepository(db.Pool)
	alertSvc := alertsvc.NewAlertService(alertRepo)
	alertHandler := alerthdlr.NewAlertHandler(alertSvc) // Use the handler alias

	evaluator := alertsvc.NewEvaluator(alertRepo, redisCache, eventBus)
	go evaluator.StartEventListener()

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })

		rules := v1.Group("/alert-rules")
		{
			rules.POST("", alertHandler.CreateRule)
			rules.GET("", alertHandler.GetAllRules)
			rules.GET("/:id", alertHandler.GetRuleByID)
			rules.PUT("/:id", alertHandler.UpdateRule)
			rules.DELETE("/:id", alertHandler.DeleteRule)
		}

		alerts := v1.Group("/alerts")
		{
			alerts.GET("/active", alertHandler.GetActiveAlerts)
			alerts.POST("/:id/acknowledge", alertHandler.AcknowledgeAlert)
		}
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
