package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/utils"
)

type FileHandler struct {
	config *config.Config
}

func NewFileHandler(cfg *config.Config) *FileHandler {
	return &FileHandler{
		config: cfg,
	}
}

// UploadImage handles image upload for questions
func (h *FileHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with max memory of 32MB
	err := r.ParseMultipartForm(32 << 20) // 32MB
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "No image file provided")
		return
	}
	defer file.Close()

	// Validate file type (only images)
	if !h.isValidImageType(handler.Header.Get("Content-Type")) {
		utils.RespondError(w, http.StatusBadRequest, "Invalid file type. Only image files are allowed")
		return
	}

	// Validate file size
	if handler.Size > int64(h.config.FileUpload.MaxFileSizeMB*1024*1024) {
		utils.RespondError(w, http.StatusBadRequest, fmt.Sprintf("File size exceeds maximum limit of %dMB", h.config.FileUpload.MaxFileSizeMB))
		return
	}

	// Generate unique filename
	ext := filepath.Ext(handler.Filename)
	uniqueFilename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// Ensure upload directory exists
	uploadDir := h.config.FileUpload.UploadPath
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Create destination file
	destPath := filepath.Join(uploadDir, uniqueFilename)
	destFile, err := os.Create(destPath)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create destination file")
		return
	}
	defer destFile.Close()

	// Copy uploaded file to destination
	_, err = io.Copy(destFile, file)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to save uploaded file")
		return
	}

	// Return the relative path for storing in database (just the filename)
	utils.RespondSuccess(w, http.StatusOK, map[string]string{
		"file_path": uniqueFilename,
		"filename":  uniqueFilename,
	}, "Image uploaded successfully")
}

// isValidImageType checks if the content type is a valid image type
func (h *FileHandler) isValidImageType(contentType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	for _, validType := range validTypes {
		if contentType == validType {
			return true
		}
	}
	return false
}

// DeleteImage removes an uploaded image file
func (h *FileHandler) DeleteImage(filePath string) error {
	// filePath is now just the filename, so we need to join it with the upload path
	fullPath := filepath.Join(h.config.FileUpload.UploadPath, filePath)
	return os.Remove(fullPath)
}
