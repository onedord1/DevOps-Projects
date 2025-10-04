package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/metrics-service/service"
)

type MetricHandler struct {
	metricService service.MetricService
}

func NewMetricHandler(metricService service.MetricService) *MetricHandler {
	return &MetricHandler{metricService: metricService}
}

func (h *MetricHandler) GetRawMetrics(c *gin.Context) {
	monitorIDStr := c.Query("monitor_id")
	fromStr := c.Query("from")
	toStr := c.Query("to")

	monitorID, err := uuid.Parse(monitorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor_id"})
		return
	}

	from, err := time.Parse(time.RFC3339, fromStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'from' timestamp format. Use RFC3339."})
		return
	}

	to, err := time.Parse(time.RFC3339, toStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'to' timestamp format. Use RFC3339."})
		return
	}

	metrics, err := h.metricService.GetRawMetrics(c.Request.Context(), monitorID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch metrics"})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

func (h *MetricHandler) GetAggregatedMetrics(c *gin.Context) {
	monitorIDStr := c.Query("monitor_id")
	fromStr := c.Query("from")
	toStr := c.Query("to")
	intervalStr := c.Query("granularity") // in minutes

	monitorID, err := uuid.Parse(monitorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid monitor_id"})
		return
	}

	from, err := time.Parse(time.RFC3339, fromStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'from' timestamp format. Use RFC3339."})
		return
	}

	to, err := time.Parse(time.RFC3339, toStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'to' timestamp format. Use RFC3339."})
		return
	}

	interval, err := strconv.Atoi(intervalStr)
	if err != nil || interval <= 0 {
		interval = 5 // Default to 5 minutes
	}

	aggregates, err := h.metricService.GetAggregatedMetrics(c.Request.Context(), monitorID, from, to, interval)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch aggregated metrics"})
		return
	}

	c.JSON(http.StatusOK, aggregates)
}
