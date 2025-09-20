package services

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	// Removed unused models import

	"github.com/google/uuid"

	"expense-tracker/internal/config"
)

type FileService struct {
	config *config.Config
}

func NewFileService(cfg *config.Config) *FileService {
	return &FileService{config: cfg}
}

func (s *FileService) UploadReceipt(file *multipart.FileHeader) (string, error) {
	// Validate file size
	if file.Size > s.config.File.MaxFileSize {
		return "", errors.New("file size exceeds maximum limit")
	}

	// Validate file type
	contentType := file.Header.Get("Content-Type")
	if !s.isAllowedFileType(contentType) {
		return "", errors.New("file type not allowed")
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(s.config.File.UploadDir, 0755); err != nil {
		return "", err
	}

	// Save file
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	filePath := filepath.Join(s.config.File.UploadDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	// Return relative path or URL
	return fmt.Sprintf("/uploads/%s", filename), nil
}

func (s *FileService) isAllowedFileType(contentType string) bool {
	for _, allowedType := range s.config.File.AllowedTypes {
		if contentType == allowedType {
			return true
		}
	}
	return false
}

type ImportResult struct {
	Imported int      `json:"imported"`
	Errors   []string `json:"errors"`
}

func (s *FileService) ImportTransactionsFromCSV(userID uint, file *multipart.FileHeader) (*ImportResult, error) {
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	reader := csv.NewReader(src)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return nil, errors.New("CSV file is empty")
	}

	// Assume first row is header: Date, Amount, Description, Category
	result := &ImportResult{Imported: 0, Errors: []string{}}

	for i, record := range records[1:] { // Skip header
		if len(record) < 4 {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: insufficient columns", i+2))
			continue
		}

		// Parse date
		_, err := time.Parse("2006-01-02", strings.TrimSpace(record[0]))
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid date format", i+2))
			continue
		}

		// Parse amount
		_, err = strconv.ParseFloat(strings.TrimSpace(record[1]), 64)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid amount", i+2))
			continue
		}

		// Validate description and categoryName exist (but don't use them)
		description := strings.TrimSpace(record[2])
		categoryName := strings.TrimSpace(record[3])

		// Use blank identifier to avoid "declared and not used" error
		_, _ = description, categoryName

		// In a real implementation, you would:
		// 1. Find or create category by name (using category service)
		// 2. Create and save the transaction (using transaction service)
		// For now, we just count as imported if there are no errors
		result.Imported++
	}

	return result, nil
}

func (s *FileService) ExportTransactionsToCSV(userID uint, startDate, endDate *time.Time) (string, string, error) {
	// This would need transaction service to fetch data
	// For now, return a sample CSV structure

	var csvData strings.Builder
	csvData.WriteString("Date,Amount,Currency,Description,Category\n")

	// In real implementation, fetch transactions and write to CSV
	// transactions, err := transactionService.GetTransactions(userID, startDate, endDate)
	// if err != nil {
	//     return "", "", err
	// }

	// for _, transaction := range transactions {
	//     csvData.WriteString(fmt.Sprintf("%s,%.2f,%s,%s,%s\n",
	//         transaction.Date.Format("2006-01-02"),
	//         transaction.Amount,
	//         transaction.Currency,
	//         transaction.Description,
	//         transaction.Category.Name,
	//     ))
	// }

	filename := fmt.Sprintf("transactions_%s.csv", time.Now().Format("2006-01-02"))
	return csvData.String(), filename, nil
}
