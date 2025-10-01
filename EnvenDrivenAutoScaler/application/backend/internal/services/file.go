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

	if file.Size > s.config.File.MaxFileSize {
		return "", errors.New("file size exceeds maximum limit")
	}


	contentType := file.Header.Get("Content-Type")
	if !s.isAllowedFileType(contentType) {
		return "", errors.New("file type not allowed")
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	if err := os.MkdirAll(s.config.File.UploadDir, 0755); err != nil {
		return "", err
	}

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

	
	result := &ImportResult{Imported: 0, Errors: []string{}}

	for i, record := range records[1:] { 
		if len(record) < 4 {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: insufficient columns", i+2))
			continue
		}


		_, err := time.Parse("2006-01-02", strings.TrimSpace(record[0]))
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid date format", i+2))
			continue
		}


		_, err = strconv.ParseFloat(strings.TrimSpace(record[1]), 64)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid amount", i+2))
			continue
		}

		
		description := strings.TrimSpace(record[2])
		categoryName := strings.TrimSpace(record[3])


		_, _ = description, categoryName
		result.Imported++
	}

	return result, nil
}

func (s *FileService) ExportTransactionsToCSV(userID uint, startDate, endDate *time.Time) (string, string, error) {
	var csvData strings.Builder
	csvData.WriteString("Date,Amount,Currency,Description,Category\n")

	filename := fmt.Sprintf("transactions_%s.csv", time.Now().Format("2006-01-02"))
	return csvData.String(), filename, nil
}
