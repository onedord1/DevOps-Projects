package controllers

import (
    "net/http"
    "time" // Added this import

    "github.com/gin-gonic/gin"

    "expense-tracker/internal/services"
    "expense-tracker/internal/utils"
)

type FileController struct {
    service *services.FileService
}

func NewFileController(service *services.FileService) *FileController {
    return &FileController{service: service}
}

func (ctrl *FileController) UploadReceipt(c *gin.Context) {
    file, err := c.FormFile("receipt")
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("No file uploaded"))
        return
    }

    url, err := ctrl.service.UploadReceipt(file)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("File uploaded successfully", gin.H{"url": url}))
}

func (ctrl *FileController) ImportCSV(c *gin.Context) {
    userID := c.GetUint("userID")
    
    file, err := c.FormFile("csv_file")
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse("No CSV file uploaded"))
        return
    }

    result, err := ctrl.service.ImportTransactionsFromCSV(userID, file)
    if err != nil {
        c.JSON(http.StatusBadRequest, utils.ErrorResponse(err.Error()))
        return
    }

    c.JSON(http.StatusOK, utils.SuccessResponse("CSV imported successfully", result))
}

func (ctrl *FileController) ExportCSV(c *gin.Context) {
    userID := c.GetUint("userID")
    
    startDateStr := c.Query("start_date")
    endDateStr := c.Query("end_date")

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

    csvData, filename, err := ctrl.service.ExportTransactionsToCSV(userID, startDate, endDate)
    if err != nil {
        c.JSON(http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
        return
    }

    c.Header("Content-Disposition", "attachment; filename="+filename)
    c.Header("Content-Type", "text/csv")
    c.String(http.StatusOK, csvData)
}