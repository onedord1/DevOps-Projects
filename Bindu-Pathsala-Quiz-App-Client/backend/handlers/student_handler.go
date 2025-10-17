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

type StudentHandler struct{}

func NewStudentHandler() *StudentHandler {
	return &StudentHandler{}
}

type AdminUpdatePasswordRequest struct {
	NewPassword string `json:"new_password"`
}

// GetAllStudents returns all students with their statuses for admin management
func (h *StudentHandler) GetAllStudents(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	query := database.DB.Where("role = ?", models.RoleStudent)

	// Optional filtering by status
	status := r.URL.Query().Get("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Optional filtering by batch
	batch := r.URL.Query().Get("batch")
	if batch != "" {
		query = query.Where("batch = ?", batch)
	}

	if err := query.Find(&users).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch students")
		return
	}

	// Convert to response format
	var responses []models.UserResponse
	for _, user := range users {
		responses = append(responses, user.ToResponse())
	}

	utils.RespondSuccess(w, http.StatusOK, responses, "")
}

// GetStudentByID returns a specific student by ID
func (h *StudentHandler) GetStudentByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, user.ToResponse(), "")
}

// ApproveStudent changes student status from pending to approved
func (h *StudentHandler) ApproveStudent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	// Update status to approved
	if err := database.DB.Model(&user).Update("status", models.StatusApproved).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to approve student")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, user.ToResponse(), "Student approved successfully")
}

// RejectStudent changes student status from pending to rejected
func (h *StudentHandler) RejectStudent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	// Update status to rejected
	if err := database.DB.Model(&user).Update("status", models.StatusRejected).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to reject student")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, user.ToResponse(), "Student rejected successfully")
}

// RevokeRejection changes student status from rejected to approved
func (h *StudentHandler) RevokeRejection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	// Update status to approved
	if err := database.DB.Model(&user).Update("status", models.StatusApproved).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to revoke rejection")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, user.ToResponse(), "Student rejection revoked successfully")
}

// DeleteStudent permanently deletes a student (admin only)
func (h *StudentHandler) DeleteStudent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	// Only allow deletion of rejected students for safety
	if user.Status != models.StatusRejected {
		utils.RespondError(w, http.StatusBadRequest, "Only rejected students can be deleted")
		return
	}

	// Delete the student
	if err := database.DB.Delete(&user).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete student")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Student deleted successfully")
}

// UpdateStudentPassword updates a student's password (admin only)
func (h *StudentHandler) UpdateStudentPassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var req AdminUpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate password
	if req.NewPassword == "" {
		utils.RespondError(w, http.StatusBadRequest, "New password is required")
		return
	}

	if len(req.NewPassword) < 6 {
		utils.RespondError(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	var user models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Student not found")
		return
	}

	// Hash new password
	if err := user.HashPassword(req.NewPassword); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Update password in database
	if err := database.DB.Model(&user).Update("password_hash", user.PasswordHash).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Student password updated successfully")
}

// GetStudentStats returns statistics about students by status
func (h *StudentHandler) GetStudentStats(w http.ResponseWriter, r *http.Request) {
	var stats struct {
		Pending  int64 `json:"pending"`
		Approved int64 `json:"approved"`
		Rejected int64 `json:"rejected"`
		Total    int64 `json:"total"`
	}

	// Count by status
	database.DB.Model(&models.User{}).Where("role = ?", models.RoleStudent).Where("status = ?", models.StatusPending).Count(&stats.Pending)
	database.DB.Model(&models.User{}).Where("role = ?", models.RoleStudent).Where("status = ?", models.StatusApproved).Count(&stats.Approved)
	database.DB.Model(&models.User{}).Where("role = ?", models.RoleStudent).Where("status = ?", models.StatusRejected).Count(&stats.Rejected)
	stats.Total = stats.Pending + stats.Approved + stats.Rejected

	utils.RespondSuccess(w, http.StatusOK, stats, "")
}
