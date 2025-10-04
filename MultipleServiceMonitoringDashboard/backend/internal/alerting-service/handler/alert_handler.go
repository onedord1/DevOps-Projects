package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/alerting-service/model"
	"github.com/your-org/monitoring-dashboard/internal/alerting-service/service"
)

type AlertHandler struct {
	alertService service.AlertService
}

func NewAlertHandler(alertService service.AlertService) *AlertHandler {
	return &AlertHandler{alertService: alertService}
}

// Rule Handlers
func (h *AlertHandler) CreateRule(c *gin.Context) {
	var rule model.AlertRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.alertService.CreateRule(c.Request.Context(), &rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create rule"})
		return
	}
	c.JSON(http.StatusCreated, rule)
}

func (h *AlertHandler) GetAllRules(c *gin.Context) {
	rules, err := h.alertService.GetAllRules(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rules"})
		return
	}
	c.JSON(http.StatusOK, rules)
}

func (h *AlertHandler) GetRuleByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}
	rule, err := h.alertService.GetRuleByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rule"})
		return
	}
	c.JSON(http.StatusOK, rule)
}

func (h *AlertHandler) UpdateRule(c *gin.Context) {
	// Placeholder implementation
	c.JSON(http.StatusNotImplemented, gin.H{"message": "UpdateRule not implemented yet"})
}

func (h *AlertHandler) DeleteRule(c *gin.Context) {
	// Placeholder implementation
	c.JSON(http.StatusNotImplemented, gin.H{"message": "DeleteRule not implemented yet"})
}

// Instance Handlers
func (h *AlertHandler) GetActiveAlerts(c *gin.Context) {
	alerts, err := h.alertService.GetActiveAlerts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active alerts"})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AlertHandler) AcknowledgeAlert(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	if err := h.alertService.AcknowledgeAlert(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acknowledge alert"})
		return
	}

	c.Status(http.StatusNoContent)
}
