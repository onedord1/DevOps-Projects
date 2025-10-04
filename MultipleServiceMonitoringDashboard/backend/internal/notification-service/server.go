package notification_service

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/notification-service/handler"
	"github.com/your-org/monitoring-dashboard/internal/notification-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/notification-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/database"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, eventBus events.EventBus) *Server {
	router := gin.Default()

	// Initialize layers
	notificationRepo := repository.NewNotificationRepository(db.Pool)
	dispatcher := service.NewDispatcher(notificationRepo, eventBus)
	go dispatcher.StartEventListener()

	// Setup handlers
	channelHandler := handler.NewChannelHandler(notificationRepo)
	templateHandler := handler.NewTemplateHandler(notificationRepo)

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })

		channels := v1.Group("/channels")
		{
			channels.POST("", channelHandler.Create)
			channels.GET("", channelHandler.GetAll)
			// ... other channel CRUD
		}

		templates := v1.Group("/templates")
		{
			templates.POST("", templateHandler.Create)
			templates.GET("", templateHandler.GetAll)
			// ... other template CRUD
		}
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
