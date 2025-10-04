package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/notification-service/service"
)

type TemplateHandler struct {
	templateService service.TemplateService
}

func NewTemplateHandler(templateService service.TemplateService) *TemplateHandler {
	return &TemplateHandler{templateService: templateService}
}

func (h *TemplateHandler) Create(c *gin.Context) {
	// Implementation to create a template
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"})
}

func (h *TemplateHandler) GetAll(c *gin.Context) {
	// Implementation to get all templates
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Not implemented yet"})
}
