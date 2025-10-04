package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/incident-service/service"
)

type IncidentHandler struct {
	incidentService service.IncidentService
}

func NewIncidentHandler(incidentService service.IncidentService) *IncidentHandler {
	return &IncidentHandler{incidentService: incidentService}
}

func (h *IncidentHandler) CreateIncident(c *gin.Context) { /* ... */ }
func (h *IncidentHandler) GetAllIncidents(c *gin.Context) {
	status := c.Query("status")
	incidents, err := h.incidentService.GetAllIncidents(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incidents"})
		return
	}
	c.JSON(http.StatusOK, incidents)
}

func (h *IncidentHandler) GetIncidentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident ID"})
		return
	}

	incident, err := h.incidentService.GetIncidentByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch incident"})
		return
	}
	if incident == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Incident not found"})
		return
	}
	c.JSON(http.StatusOK, incident)
}

func (h *IncidentHandler) GetTimeline(c *gin.Context) { /* ... */ }
func (h *IncidentHandler) AddComment(c *gin.Context)  { /* ... */ }
func (h *IncidentHandler) ResolveIncident(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident ID"})
		return
	}

	if err := h.incidentService.ResolveIncident(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve incident"})
		return
	}

	c.Status(http.StatusNoContent)
}
