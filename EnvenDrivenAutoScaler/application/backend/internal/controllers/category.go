package controllers

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"

    "expense-tracker/internal/services"
    "expense-tracker/internal/utils"
)

type CategoryController struct {
    service *services.CategoryService
}

// Controller-specific request DTO with validation
type CreateCategoryRequest struct {
    Name  string `json:"name" validate:"required,min=2,max=100"`
    Type  string `json:"type" validate:"required,oneof=expense income"`
    Color string `json:"color" validate:"required,min=3,max=7"`
    Icon  string `json:"icon" validate:"required,min=1,max=50"`
}

func NewCategoryController(service *services.CategoryService) *CategoryController {
    return &CategoryController{service: service}
}

func (ctrl *CategoryController) GetCategories(c *gin.Context) {
    userID := c.GetUint("userID")
    
    categories, err := ctrl.service.GetCategories(userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Categories retrieved successfully", categories))
}

func (ctrl *CategoryController) CreateCategory(c *gin.Context) {
    userID := c.GetUint("userID")
    
    var req CreateCategoryRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    if err := utils.ValidateStruct(req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    // Convert controller request to service request
    serviceReq := services.CreateCategoryRequest{
        Name:  req.Name,
        Type:  req.Type,
        Color: req.Color,
        Icon:  req.Icon,
    }

    category, err := ctrl.service.CreateCategory(userID, &serviceReq)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusCreated, utils.SuccessResponse("Category created successfully", category))
}

func (ctrl *CategoryController) UpdateCategory(c *gin.Context) {
    userID := c.GetUint("userID")
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid category ID"))
        return
    }

    var req CreateCategoryRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    // Convert controller request to service request
    serviceReq := services.CreateCategoryRequest{
        Name:  req.Name,
        Type:  req.Type,
        Color: req.Color,
        Icon:  req.Icon,
    }

    category, err := ctrl.service.UpdateCategory(uint(id), userID, &serviceReq)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Category updated successfully", category))
}

func (ctrl *CategoryController) DeleteCategory(c *gin.Context) {
    userID := c.GetUint("userID")
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid category ID"))
        return
    }

    err = ctrl.service.DeleteCategory(uint(id), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Category deleted successfully", nil))
}