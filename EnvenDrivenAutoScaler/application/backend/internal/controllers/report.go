package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"expense-tracker/internal/services"
	"expense-tracker/internal/utils"
)

type ReportController struct {
	service *services.ReportService
}

func NewReportController(service *services.ReportService) *ReportController {
	return &ReportController{service: service}
}

func (ctrl *ReportController) GetSummary(c *gin.Context) {
	userID := c.GetUint("userID")

	startDateStr := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid start_date format"))
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse("Invalid end_date format"))
		return
	}

	summary, err := ctrl.service.GetSummary(userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Summary retrieved successfully", summary))
}

func (ctrl *ReportController) GetTrends(c *gin.Context) {
	userID := c.GetUint("userID")

	period := c.DefaultQuery("period", "monthly")
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))

	trends, err := ctrl.service.GetTrends(userID, period, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Trends retrieved successfully", trends))
}

func (ctrl *ReportController) GetCategoryBreakdown(c *gin.Context) {
	userID := c.GetUint("userID")

	startDateStr := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, _ := time.Parse("2006-01-02", startDateStr)
	endDate, _ := time.Parse("2006-01-02", endDateStr)

	breakdown, err := ctrl.service.GetCategoryBreakdown(userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Category breakdown retrieved successfully", breakdown))
}

func (ctrl *ReportController) GetBudgetAnalysis(c *gin.Context) {
	userID := c.GetUint("userID")

	analysis, err := ctrl.service.GetBudgetAnalysis(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse("Budget analysis retrieved successfully", analysis))
}
