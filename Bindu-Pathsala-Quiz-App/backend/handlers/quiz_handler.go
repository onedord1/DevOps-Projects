package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/middleware"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
)

type QuizHandler struct{}

func NewQuizHandler() *QuizHandler {
	return &QuizHandler{}
}

type CreateQuizRequest struct {
	SubjectID       uuid.UUID `json:"subject_id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	TimePerQuestion *int      `json:"time_per_question"`
	AllowedTime     *int      `json:"allowed_time"`
	RandomizeOrder  bool      `json:"randomize_order"`
	Batch           string    `json:"batch"`
}

type UpdateQuizRequest struct {
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	TimePerQuestion *int      `json:"time_per_question"`
	AllowedTime     *int      `json:"allowed_time"`
	RandomizeOrder  bool      `json:"randomize_order"`
	Status          string    `json:"status"`
	Batch           string    `json:"batch"`
}

// isQuizAvailableForUser checks if a quiz is available for a specific user (considering sessions)
func isQuizAvailableForUser(quiz *models.Quiz, user *models.User) bool {
	now := time.Now()

	// Check if student has already submitted this quiz
	var submittedAttempt models.QuizAttempt
	submittedErr := database.DB.Where("quiz_id = ? AND user_id = ? AND status = ?",
		quiz.ID, user.ID, models.AttemptStatusGraded).First(&submittedAttempt).Error

	if submittedErr == nil {
		fmt.Printf("DEBUG: User %s has already submitted quiz %s\n", user.ID, quiz.ID)
		return false // User has already submitted this quiz
	}

	// For published quizzes, check batch restrictions
	if quiz.Status == models.QuizStatusPublished {
		// If quiz has a batch restriction, check if user is in that batch
		if quiz.Batch != "" {
			// Quiz is restricted to a specific batch
			if user.Batch == "" {
				// User has no batch, cannot access batch-restricted quiz
				fmt.Printf("DEBUG: User has no batch, cannot access batch-restricted quiz %s\n", quiz.ID)
				return false
			} else if user.Batch != quiz.Batch {
				// User batch doesn't match quiz batch
				fmt.Printf("DEBUG: User batch %s doesn't match quiz batch %s\n", user.Batch, quiz.Batch)
				return false
			}
			// User batch matches quiz batch
			return true
		} else {
			// Quiz has no batch restriction (global)
			if user.Batch != "" {
				// User has a batch, cannot access global quizzes with strict isolation
				fmt.Printf("DEBUG: User with batch %s cannot access global quiz %s\n", user.Batch, quiz.ID)
				return false
			}
			// User has no batch, can access global quiz
			return true
		}
	}

	fmt.Printf("DEBUG: Quiz %s not available - status: %s\n", quiz.ID, quiz.Status)

	// If quiz itself is not available, check if there's an active session for user's batch
	if user != nil && user.Batch != "" {
		var session models.QuizSession
		err := database.DB.Where("quiz_id = ? AND batch_name = ? AND is_active = ? AND start_time <= ? AND end_time >= ?",
			quiz.ID, user.Batch, true, now, now).First(&session).Error

		if err != nil {
			fmt.Printf("DEBUG: No active session found for user batch: %s\n", user.Batch)
			return false
		}

		fmt.Printf("DEBUG: Active session found for user batch: %s\n", user.Batch)
		return true // Active session found
	}

	fmt.Printf("DEBUG: User has no batch or no session available\n")
	return false
}

// GetQuizzesBySubject returns all quizzes for a subject
func (h *QuizHandler) GetQuizzesBySubject(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	subjectID, err := uuid.Parse(vars["subjectId"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid subject ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var quizzes []models.Quiz
	query := database.DB.Where("subject_id = ?", subjectID)

	// Students only see published quizzes
	if user.Role == models.RoleStudent {
		query = query.Where("status = ?", models.QuizStatusPublished)
	}

	// Filter by batch if user has a batch
	if user.Role == models.RoleStudent && user.Batch != "" {
		fmt.Printf("DEBUG: User %s (batch: %s) filtering quizzes by batch\n", user.ID, user.Batch)
		// Students with batches can only see quizzes for their specific batch
		query = query.Where("batch = ?", user.Batch)
	} else if user.Role == models.RoleStudent {
		fmt.Printf("DEBUG: User %s has no batch, showing only global quizzes\n", user.ID)
		// Students without batches can only see quizzes without batch restrictions
		query = query.Where("batch = '' OR batch IS NULL")
	}

	if err := query.Preload("Subject").Find(&quizzes).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch quizzes")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, quizzes, "")
}

// GetQuiz returns a specific quiz
func (h *QuizHandler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quizID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid quiz ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var quiz models.Quiz
	query := database.DB.Where("id = ?", quizID)

	// Students can only see published quizzes
	if user.Role == models.RoleStudent {
		query = query.Where("status = ?", models.QuizStatusPublished)
	}

	// CRITICAL: Add batch filtering for individual quiz access
	if user.Role == models.RoleStudent && user.Batch != "" {
		// Students with batches can only access quizzes for their specific batch
		query = query.Where("batch = ?", user.Batch)
	} else if user.Role == models.RoleStudent {
		// Students without batches can only access quizzes without batch restrictions
		query = query.Where("batch = '' OR batch IS NULL")
	}

	if err := query.Preload("Subject").First(&quiz).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz not found or access denied")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, quiz, "")
}

// CreateQuiz creates a new quiz (Admin only)
func (h *QuizHandler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	var req CreateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Title == "" {
		utils.RespondError(w, http.StatusBadRequest, "Quiz title is required")
		return
	}

	if req.EndTime.Before(req.StartTime) {
		utils.RespondError(w, http.StatusBadRequest, "End time must be after start time")
		return
	}

	// Verify subject exists
	var subject models.Subject
	if err := database.DB.First(&subject, req.SubjectID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Subject not found")
		return
	}

	quiz := models.Quiz{
		SubjectID:       req.SubjectID,
		Title:           req.Title,
		Description:     req.Description,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		TimePerQuestion: req.TimePerQuestion,
		AllowedTime:     req.AllowedTime,
		RandomizeOrder:  req.RandomizeOrder,
		Status:          models.QuizStatusDraft,
		Batch:           req.Batch,
	}

	if err := database.DB.Create(&quiz).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create quiz")
		return
	}

	// Load subject relation
	database.DB.Preload("Subject").First(&quiz, quiz.ID)

	utils.RespondSuccess(w, http.StatusCreated, quiz, "Quiz created successfully")
}

// UpdateQuiz updates an existing quiz (Admin only)
func (h *QuizHandler) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quizID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid quiz ID")
		return
	}

	var req UpdateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var quiz models.Quiz
	if err := database.DB.First(&quiz, quizID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz not found")
		return
	}

	// Update fields
	if req.Title != "" {
		quiz.Title = req.Title
	}
	quiz.Description = req.Description
	if !req.StartTime.IsZero() {
		quiz.StartTime = req.StartTime
	}
	if !req.EndTime.IsZero() {
		quiz.EndTime = req.EndTime
	}
	quiz.TimePerQuestion = req.TimePerQuestion
	quiz.AllowedTime = req.AllowedTime
	quiz.RandomizeOrder = req.RandomizeOrder
	quiz.Batch = req.Batch

	if req.Status != "" {
		quiz.Status = models.QuizStatus(req.Status)
	}

	if quiz.EndTime.Before(quiz.StartTime) {
		utils.RespondError(w, http.StatusBadRequest, "End time must be after start time")
		return
	}

	if err := database.DB.Save(&quiz).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update quiz")
		return
	}

	database.DB.Preload("Subject").First(&quiz, quiz.ID)

	utils.RespondSuccess(w, http.StatusOK, quiz, "Quiz updated successfully")
}

// DeleteQuiz deletes a quiz (Admin only)
func (h *QuizHandler) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quizID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid quiz ID")
		return
	}

	var quiz models.Quiz
	if err := database.DB.First(&quiz, quizID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz not found")
		return
	}

	if err := database.DB.Delete(&quiz).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete quiz")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Quiz deleted successfully")
}

// GetQuizQuestions returns questions for a quiz (for taking the quiz)
func (h *QuizHandler) GetQuizQuestions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	quizID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid quiz ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// Get quiz
	var quiz models.Quiz
	if err := database.DB.First(&quiz, quizID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz not found")
		return
	}

	// Check if quiz is available for this user (considering sessions)
	if user.Role == models.RoleStudent && !isQuizAvailableForUser(&quiz, user) {
		// Check if user has already submitted this quiz
		var submittedAttempt models.QuizAttempt
		submittedErr := database.DB.Where("quiz_id = ? AND user_id = ? AND status = ?",
			quiz.ID, user.ID, models.AttemptStatusGraded).First(&submittedAttempt).Error

		if submittedErr == nil {
			utils.RespondError(w, http.StatusConflict, "You have already submitted this quiz")
			return
		}

		utils.RespondError(w, http.StatusForbidden, "Quiz is not currently available")
		return
	}

	// Get questions with options
	var questions []models.Question
	if err := database.DB.Where("quiz_id = ?", quizID).Preload("Options").Find(&questions).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch questions")
		return
	}

	// For students, randomize if configured and don't show correct answers
	if user.Role == models.RoleStudent {
		if quiz.RandomizeOrder {
			rand.Seed(time.Now().UnixNano())
			rand.Shuffle(len(questions), func(i, j int) {
				questions[i], questions[j] = questions[j], questions[i]
			})
		}

		// Convert to questions without correct answers
		questionsWithoutAnswers := make([]models.QuestionWithoutCorrectAnswers, len(questions))
		for i, q := range questions {
			questionsWithoutAnswers[i] = q.ToQuestionWithoutCorrectAnswers()
		}
		utils.RespondSuccess(w, http.StatusOK, questionsWithoutAnswers, "")
		return
	}

	// Admin sees everything including correct answers
	utils.RespondSuccess(w, http.StatusOK, questions, "")
}
