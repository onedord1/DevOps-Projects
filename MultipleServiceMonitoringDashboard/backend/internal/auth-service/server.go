package auth_service

import (
	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/auth-service/handler"
	"github.com/your-org/monitoring-dashboard/internal/auth-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/auth-service/service"
	"github.com/your-org/monitoring-dashboard/pkg/database"
)

type Server struct {
	router *gin.Engine
}

func NewServer(db *database.PostgresDB, jwtSecret string) *Server {
	router := gin.Default()

	// Initialize layers
	userRepo := repository.NewUserRepository(db.Pool)
	userSvc := service.NewUserService(userRepo, jwtSecret)
	userHandler := handler.NewUserHandler(userSvc)

	// Setup routes
	v1 := router.Group("/api/v1")
	{
		v1.POST("/register", userHandler.Register)
		v1.POST("/login", userHandler.Login)
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}
