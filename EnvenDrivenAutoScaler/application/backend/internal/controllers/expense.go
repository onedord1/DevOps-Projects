package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"expense-tracker/internal/services"
	"expense-tracker/internal/utils"
)

type ExpenseController struct {
	service *services.ExpenseService
}

// Controller-specific request DTO with validation
type CreateExpenseRequest struct {
	CategoryID  uint        `json:"category_id" validate:"required"`
	Amount      float64     `json:"amount" validate:"required,gt=0"`
	Currency    string      `json:"currency" validate:"required,len=3"`
	Date        time.Time   `json:"date" validate:"required"`
	Description string      `json:"description" validate:"max=500"`
	ReceiptURL  string      `json:"receipt_url"` // String in request, will be converted to pointer
	Tags        interface{} `json:"tags"`        // Can be string or array of strings
}

func NewExpenseController(service *services.ExpenseService) *ExpenseController {
	return &ExpenseController{service: service}
}

func (ctrl *ExpenseController) CreateExpense(c *gin.Context) {
	userID := c.GetUint("userID")

	var req CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}
	decodedJSON, err := json.MarshalIndent(req, "", "  ")
	if err != nil {
		log.Println("Failed to re-encode JSON:", err)
	} else {
		fmt.Println("Backend Req. Body: ", string(decodedJSON))
	}

	if err := utils.ValidateStruct(req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Convert controller request to service request
	serviceReq := ctrl.convertToServiceRequest(req)

	expense, err := ctrl.service.CreateExpense(userID, &serviceReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, utils.SuccessResponse("Expense created successfully", expense))
}

func (ctrl *ExpenseController) GetExpenses(c *gin.Context) {
	userID := c.GetUint("userID")

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	categoryIDStr := c.Query("category_id")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	var categoryID *uint
	if categoryIDStr != "" {
		if id, err := strconv.ParseUint(categoryIDStr, 10, 32); err == nil {
			categoryIDUint := uint(id)
			categoryID = &categoryIDUint
		}
	}

	var startDate, endDate *time.Time
	if startDateStr != "" {
		if date, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &date
		}
	}
	if endDateStr != "" {
		if date, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &date
		}
	}

	expenses, err := ctrl.service.GetExpenses(userID, page, limit, startDate, endDate, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expenses retrieved successfully", expenses))
}

func (ctrl *ExpenseController) GetExpense(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid expense ID"))
		return
	}

	expense, err := ctrl.service.GetExpense(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse("Expense not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expense retrieved successfully", expense))
}

func (ctrl *ExpenseController) UpdateExpense(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid expense ID"))
		return
	}

	var req CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
		return
	}

	// Convert controller request to service request
	serviceReq := ctrl.convertToServiceRequest(req)

	expense, err := ctrl.service.UpdateExpense(uint(id), userID, &serviceReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expense updated successfully", expense))
}

func (ctrl *ExpenseController) DeleteExpense(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid expense ID"))
		return
	}

	err = ctrl.service.DeleteExpense(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Expense deleted successfully", nil))
}

// Helper method to convert controller request to service request
func (ctrl *ExpenseController) convertToServiceRequest(req CreateExpenseRequest) services.CreateExpenseRequest {
	// Convert ReceiptURL string to pointer
	var receiptURLPtr *string
	if req.ReceiptURL != "" {
		receiptURLPtr = &req.ReceiptURL
	}

	// Handle Tags - can be string or array of strings
	var tagsSlice []string
	if req.Tags != nil {
		switch req.Tags.(type) {
		case string:
			// If it's a string, split by comma
			if req.Tags != "" {
				tagStrs := strings.Split(req.Tags.(string), ",")
				for _, tagStr := range tagStrs {
					trimmedTag := strings.TrimSpace(tagStr)
					if trimmedTag != "" {
						tagsSlice = append(tagsSlice, trimmedTag)
					}
				}
			}
		case []interface{}:
			// If it's an array of interfaces, convert to strings
			for _, tagInterface := range req.Tags.([]interface{}) {
				if tagStr, ok := tagInterface.(string); ok {
					trimmedTag := strings.TrimSpace(tagStr)
					if trimmedTag != "" {
						tagsSlice = append(tagsSlice, trimmedTag)
					}
				}
			}
		case []string:
			// If it's already an array of strings, just trim each element
			for _, tagStr := range req.Tags.([]string) {
				trimmedTag := strings.TrimSpace(tagStr)
				if trimmedTag != "" {
					tagsSlice = append(tagsSlice, trimmedTag)
				}
			}
		}
	}

	return services.CreateExpenseRequest{
		CategoryID:  req.CategoryID,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Date:        req.Date,
		Description: req.Description,
		ReceiptURL:  receiptURLPtr,
		Tags:        tagsSlice,
	}
}
