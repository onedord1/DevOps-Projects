package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"expense-tracker/internal/services"
)

type TagController struct {
	tagService *services.TagService
}

func NewTagController(tagService *services.TagService) *TagController {
	return &TagController{tagService: tagService}
}

func (ctrl *TagController) GetTags(c *gin.Context) {
	tags, err := ctrl.tagService.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch tags",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Tags retrieved successfully",
		"data":    tags,
	})
}
