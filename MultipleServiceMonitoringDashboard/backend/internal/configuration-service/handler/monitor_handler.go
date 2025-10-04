package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
	"github.com/your-org/monitoring-dashboard/internal/configuration-service/service"
)

type MonitorHandler struct {
	monitorService service.MonitorService
}

func NewMonitorHandler(monitorService service.MonitorService) *MonitorHandler {
	return &MonitorHandler{monitorService: monitorService}
}

func (h *MonitorHandler) Create(c *gin.Context) {
	var monitor models.Monitor
	if err := c.ShouldBindJSON(&monitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.monitorService.CreateMonitor(c.Request.Context(), &monitor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create monitor"})
		return
	}

	c.JSON(http.StatusCreated, monitor)
}

func (h *MonitorHandler) GetAll(c *gin.Context) {
	// Basic filtering, can be expanded
	filter := make(map[string]interface{})
	if env := c.Query("environment"); env != "" {
		filter["environment"] = env
	}

	monitors, err := h.monitorService.GetAllMonitors(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitors"})
		return
	}

	c.JSON(http.StatusOK, monitors)
}

func (h *MonitorHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor ID"})
		return
	}

	monitor, err := h.monitorService.GetMonitor(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Monitor not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitor"})
		return
	}

	c.JSON(http.StatusOK, monitor)
}

func (h *MonitorHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor ID"})
		return
	}

	var monitor models.Monitor
	if err := c.ShouldBindJSON(&monitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	monitor.ID = id
	if err := h.monitorService.UpdateMonitor(c.Request.Context(), &monitor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update monitor"})
		return
	}

	c.JSON(http.StatusOK, monitor)
}

func (h *MonitorHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor ID"})
		return
	}

	if err := h.monitorService.DeleteMonitor(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete monitor"})
		return
	}

	c.Status(http.StatusNoContent)
}
