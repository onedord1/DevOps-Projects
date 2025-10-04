package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/api-gateway/service"
	"github.com/your-org/monitoring-dashboard/internal/common/models"
)

type DashboardHandler struct {
	configClient  *service.ConfigClient
	metricsClient *service.MetricsClient
}

func NewDashboardHandler(configClient *service.ConfigClient, metricsClient *service.MetricsClient) *DashboardHandler {
	return &DashboardHandler{
		configClient:  configClient,
		metricsClient: metricsClient,
	}
}

// MonitorStatus represents the status of a monitor for the dashboard
type MonitorStatus struct {
	*models.Monitor
	LatestLatencyMs *float64 `json:"latest_latency_ms"`
	IsUp            bool     `json:"is_up"`
}

func (h *DashboardHandler) GetDashboardView(c *gin.Context) {
	// 1. Fetch all monitors
	monitors, err := h.configClient.GetAllMonitors(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch monitors"})
		return
	}

	// 2. For each monitor, fetch the latest metric
	var dashboardData []MonitorStatus
	now := time.Now()
	from := now.Add(-10 * time.Minute) // Get data from the last 10 minutes

	for _, monitor := range monitors {
		aggregates, err := h.metricsClient.GetAggregatedMetrics(c.Request.Context(), monitor.ID, from, now, 10)
		status := MonitorStatus{Monitor: monitor, IsUp: true} // Default to up

		if err == nil && len(aggregates) > 0 {
			latest := aggregates[0]
			status.LatestLatencyMs = latest.P95                     // Use P95 as a representative latency
			if latest.ErrorRate != nil && *latest.ErrorRate > 0.5 { // > 50% error rate
				status.IsUp = false
			}
		} else if err != nil {
			// If we can't get metrics, assume it's down
			status.IsUp = false
		}

		dashboardData = append(dashboardData, status)
	}

	c.JSON(http.StatusOK, dashboardData)
}
