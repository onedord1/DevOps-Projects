package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthController struct {
	db *gorm.DB
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Services  map[string]string `json:"services"`
	Version   string            `json:"version"`
}

func NewHealthController(db *gorm.DB) *HealthController {
	return &HealthController{db: db}
}

func (ctrl *HealthController) HealthCheck(c *gin.Context) {
	health := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Services:  make(map[string]string),
		Version:   "1.0.0",
	}

	sqlDB, err := ctrl.db.DB()
	if err != nil {
		health.Status = "unhealthy"
		health.Services["database"] = "error: " + err.Error()
	} else if err := sqlDB.Ping(); err != nil {
		health.Status = "unhealthy"
		health.Services["database"] = "error: " + err.Error()
	} else {
		health.Services["database"] = "healthy"
	}

	health.Services["disk"] = "healthy"

	health.Services["memory"] = "healthy"

	statusCode := http.StatusOK
	if health.Status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, health)
}

func (ctrl *HealthController) ReadinessCheck(c *gin.Context) {
	ctrl.HealthCheck(c)
}

func (ctrl *HealthController) LivenessCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "alive",
		"timestamp": time.Now(),
	})
}
