package controllers

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"

    "expense-tracker/internal/services"
    "expense-tracker/internal/utils"
)

type BudgetController struct {
    service *services.BudgetService
}

// Controller-specific request DTO with validation
type CreateBudgetRequest struct {
    CategoryID *uint     `json:"category_id" validate:"omitempty"` // Optional for overall budget
    Amount     float64   `json:"amount" validate:"required,gt=0"`
    Currency   string    `json:"currency" validate:"required"`
    Period     string    `json:"period" validate:"required,oneof=weekly monthly yearly"`
    StartDate  time.Time `json:"start_date" validate:"required"`
    EndDate    *time.Time `json:"end_date" validate:"omitempty"` // Optional end date
}

func NewBudgetController(service *services.BudgetService) *BudgetController {
    return &BudgetController{service: service}
}

func (ctrl *BudgetController) GetBudgets(c *gin.Context) {
    userID := c.GetUint("userID")
    
    budgets, err := ctrl.service.GetBudgets(userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Budgets retrieved successfully", budgets))
}

func (ctrl *BudgetController) CreateBudget(c *gin.Context) {
    userID := c.GetUint("userID")
    
    var req CreateBudgetRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    if err := utils.ValidateStruct(req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    // Convert controller request to service request
    serviceReq := services.CreateBudgetRequest{
        CategoryID: req.CategoryID,
        Amount:     req.Amount,
        Currency:   req.Currency,
        Period:     req.Period,
        StartDate:  req.StartDate,
        EndDate:    req.EndDate,
    }

    budget, err := ctrl.service.CreateBudget(userID, &serviceReq)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusCreated, utils.SuccessResponse("Budget created successfully", budget))
}

func (ctrl *BudgetController) UpdateBudget(c *gin.Context) {
    userID := c.GetUint("userID")
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid budget ID"))
        return
    }

    var req CreateBudgetRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    // Convert controller request to service request
    serviceReq := services.CreateBudgetRequest{
        CategoryID: req.CategoryID,
        Amount:     req.Amount,
        Currency:   req.Currency,
        Period:     req.Period,
        StartDate:  req.StartDate,
        EndDate:    req.EndDate,
    }

    budget, err := ctrl.service.UpdateBudget(uint(id), userID, &serviceReq)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Budget updated successfully", budget))
}

func (ctrl *BudgetController) DeleteBudget(c *gin.Context) {
    userID := c.GetUint("userID")
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid budget ID"))
        return
    }

    err = ctrl.service.DeleteBudget(uint(id), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("Budget deleted successfully", nil))
}