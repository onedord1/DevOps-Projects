package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
)

type SubjectHandler struct{}

func NewSubjectHandler() *SubjectHandler {
	return &SubjectHandler{}
}

type CreateSubjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type UpdateSubjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// GetSubjects returns all subjects with quiz count
func (h *SubjectHandler) GetSubjects(w http.ResponseWriter, r *http.Request) {
	var subjects []models.Subject
	if err := database.DB.Find(&subjects).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch subjects")
		return
	}

	// Get quiz count for each subject
	var subjectsWithCount []models.SubjectWithQuizCount
	for _, subject := range subjects {
		var count int64
		database.DB.Model(&models.Quiz{}).Where("subject_id = ? AND status = ?", subject.ID, models.QuizStatusPublished).Count(&count)
		
		subjectsWithCount = append(subjectsWithCount, models.SubjectWithQuizCount{
			Subject:   subject,
			QuizCount: int(count),
		})
	}

	utils.RespondSuccess(w, http.StatusOK, subjectsWithCount, "")
}

// GetSubject returns a specific subject
func (h *SubjectHandler) GetSubject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subjectID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid subject ID")
		return
	}

	var subject models.Subject
	if err := database.DB.First(&subject, subjectID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Subject not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, subject, "")
}

// CreateSubject creates a new subject (Admin only)
func (h *SubjectHandler) CreateSubject(w http.ResponseWriter, r *http.Request) {
	var req CreateSubjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		utils.RespondError(w, http.StatusBadRequest, "Subject name is required")
		return
	}

	subject := models.Subject{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := database.DB.Create(&subject).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create subject")
		return
	}

	utils.RespondSuccess(w, http.StatusCreated, subject, "Subject created successfully")
}

// UpdateSubject updates an existing subject (Admin only)
func (h *SubjectHandler) UpdateSubject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subjectID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid subject ID")
		return
	}

	var req UpdateSubjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var subject models.Subject
	if err := database.DB.First(&subject, subjectID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Subject not found")
		return
	}

	if req.Name != "" {
		subject.Name = req.Name
	}
	subject.Description = req.Description

	if err := database.DB.Save(&subject).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update subject")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, subject, "Subject updated successfully")
}

// DeleteSubject deletes a subject (Admin only)
func (h *SubjectHandler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subjectID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid subject ID")
		return
	}

	var subject models.Subject
	if err := database.DB.First(&subject, subjectID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Subject not found")
		return
	}

	if err := database.DB.Delete(&subject).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete subject")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Subject deleted successfully")
}
