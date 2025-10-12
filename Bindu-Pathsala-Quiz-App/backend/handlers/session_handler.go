package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"

	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
	"github.com/quiz-hosting-app/backend/middleware"
)

type SessionHandler struct{}

func NewSessionHandler() *SessionHandler {
	return &SessionHandler{}
}

type CreateSessionRequest struct {
	QuizID    string    `json:"quiz_id"`
	BatchName string    `json:"batch_name"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type UpdateSessionRequest struct {
	BatchName string    `json:"batch_name"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	IsActive  bool      `json:"is_active"`
}

// CreateSession creates a new quiz session (batch)
func (h *SessionHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate inputs
	if req.QuizID == "" || req.BatchName == "" {
		utils.RespondError(w, http.StatusBadRequest, "Quiz ID and batch name are required")
		return
	}

	if req.StartTime.After(req.EndTime) {
		utils.RespondError(w, http.StatusBadRequest, "Start time must be before end time")
		return
	}

	quizID, err := uuid.Parse(req.QuizID)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid quiz ID")
		return
	}

	session := models.QuizSession{
		QuizID:    quizID,
		BatchName: req.BatchName,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		IsActive:  true,
	}

	if err := database.DB.Create(&session).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Load quiz data
	database.DB.Preload("Quiz").First(&session, session.ID)

	utils.RespondSuccess(w, http.StatusCreated, session.ToResponse(), "Session created successfully")
}

// GetSessionsByQuiz gets all sessions for a specific quiz
func (h *SessionHandler) GetSessionsByQuiz(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quizID := vars["quizId"]

	var sessions []models.QuizSession
	if err := database.DB.Where("quiz_id = ?", quizID).
		Order("start_time ASC").
		Preload("Quiz").
		Find(&sessions).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	responses := make([]models.QuizSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.ToResponse()
	}

	utils.RespondSuccess(w, http.StatusOK, responses, "Sessions retrieved successfully")
}

// GetAvailableSessions gets all currently available sessions for students
func (h *SessionHandler) GetAvailableSessions(w http.ResponseWriter, r *http.Request) {
	now := time.Now()

	var sessions []models.QuizSession
	if err := database.DB.Where("is_active = ? AND start_time <= ? AND end_time >= ?", true, now, now).
		Preload("Quiz").
		Preload("Quiz.Subject").
		Find(&sessions).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	responses := make([]models.QuizSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.ToResponse()
	}

	utils.RespondSuccess(w, http.StatusOK, responses, "Available sessions retrieved successfully")
}

// GetSessionsBySubject gets all sessions for quizzes in a subject (filtered by user's batch)
func (h *SessionHandler) GetSessionsBySubject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subjectID := vars["subjectId"]

	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	now := time.Now()

	var sessions []models.QuizSession
	query := database.DB.
		Joins("JOIN quizzes ON quizzes.id = quiz_sessions.quiz_id").
		Where("quizzes.subject_id = ? AND quiz_sessions.is_active = ? AND quiz_sessions.start_time <= ? AND quiz_sessions.end_time >= ?",
			subjectID, true, now, now)

	// Filter by batch if user has a batch assigned
	if user.Batch != nil && *user.Batch != "" {
		query = query.Where("quiz_sessions.batch_name = ?", *user.Batch)
	}

	query = query.Preload("Quiz").Preload("Quiz.Subject")

	if err := query.Find(&sessions).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	responses := make([]models.QuizSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = session.ToResponse()
	}

	utils.RespondSuccess(w, http.StatusOK, responses, "Sessions retrieved successfully")
}

// GetSession gets a specific session
func (h *SessionHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	var session models.QuizSession
	if err := database.DB.Preload("Quiz").Preload("Quiz.Subject").
		First(&session, "id = ?", sessionID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Session not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, session.ToResponse(), "Session retrieved successfully")
}

// UpdateSession updates a session
func (h *SessionHandler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	var req UpdateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var session models.QuizSession
	if err := database.DB.First(&session, "id = ?", sessionID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Session not found")
		return
	}

	if req.StartTime.After(req.EndTime) {
		utils.RespondError(w, http.StatusBadRequest, "Start time must be before end time")
		return
	}

	session.BatchName = req.BatchName
	session.StartTime = req.StartTime
	session.EndTime = req.EndTime
	session.IsActive = req.IsActive

	if err := database.DB.Save(&session).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update session")
		return
	}

	database.DB.Preload("Quiz").First(&session, session.ID)

	utils.RespondSuccess(w, http.StatusOK, session.ToResponse(), "Session updated successfully")
}

// DeleteSession deletes a session
func (h *SessionHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	if err := database.DB.Delete(&models.QuizSession{}, "id = ?", sessionID).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete session")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Session deleted successfully")
}
