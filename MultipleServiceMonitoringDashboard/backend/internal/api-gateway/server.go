package api_gateway

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/api-gateway/handler"
	"github.com/your-org/monitoring-dashboard/internal/api-gateway/middleware"
	"github.com/your-org/monitoring-dashboard/internal/api-gateway/service"
	"github.com/your-org/monitoring-dashboard/internal/common/config"
)

type Server struct {
	router *gin.Engine
}

func NewServer(cfg *config.Config) *Server {
	router := gin.Default()

	// CORS Middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*") // In production, be more specific
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// Initialize clients
	authClient := service.NewAuthClient(os.Getenv("AUTH_SERVICE_URL"))
	configClient := service.NewConfigClient(os.Getenv("CONFIG_SERVICE_URL"))
	metricsClient := service.NewMetricsClient(os.Getenv("METRICS_SERVICE_URL"))

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authClient)
	dashboardHandler := handler.NewDashboardHandler(configClient, metricsClient)

	// Public routes
	v1 := router.Group("/api/v1")
	{
		v1.POST("/login", authHandler.Login)
		// Add /register if needed
	}

	// Protected routes
	protected := v1.Group("/")
	protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	{
		protected.GET("/dashboard", dashboardHandler.GetDashboardView)

		// Proxy CRUD operations to the Config Service
		monitors := protected.Group("/monitors")
		monitors.Any("/*path", gin.WrapH(createProxy(os.Getenv("CONFIG_SERVICE_URL"))))

		// Proxy metric queries to the Metrics Service
		metrics := protected.Group("/metrics")
		metrics.Any("/*path", gin.WrapH(createProxy(os.Getenv("METRICS_SERVICE_URL"))))
	}

	return &Server{router: router}
}

func (s *Server) Start(port string) error {
	return s.router.Run(port)
}

// createProxy creates a simple reverse proxy handler to forward requests.
// It requires the "net/http/httputil" and "net/url" packages.
func createProxy(target string) http.Handler {
	targetURL, err := url.Parse(target)
	if err != nil {
		// In a real application, you'd handle this error more gracefully
		panic(err)
	}
	return httputil.NewSingleHostReverseProxy(targetURL)
}
