package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/middleware"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
)

type AttemptHandler struct{}

func NewAttemptHandler() *AttemptHandler {
	return &AttemptHandler{}
}

type StartAttemptRequest struct {
	QuizID uuid.UUID `json:"quiz_id"`
}

type SubmitAnswerRequest struct {
	QuestionID       uuid.UUID  `json:"question_id"`
	SelectedOptionID *uuid.UUID `json:"selected_option_id"`
	TimeTaken        *int       `json:"time_taken"`
}

// StartAttempt creates a new quiz attempt
func (h *AttemptHandler) StartAttempt(w http.ResponseWriter, r *http.Request) {
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
	if !isQuizAvailableForUser(&quiz, user) {
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

	// Check for existing in-progress attempt
	var existingAttempt models.QuizAttempt
	if err := database.DB.Where("quiz_id = ? AND user_id = ? AND status = ?", quizID, user.ID, models.AttemptStatusInProgress).First(&existingAttempt).Error; err == nil {
		// Return existing attempt
		utils.RespondSuccess(w, http.StatusOK, existingAttempt, "Resuming existing attempt")
		return
	}

	// Create new attempt
	attempt := models.QuizAttempt{
		QuizID:    quizID,
		UserID:    user.ID,
		Status:    models.AttemptStatusInProgress,
		StartedAt: time.Now(),
	}

	if err := database.DB.Create(&attempt).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create quiz attempt")
		return
	}

	utils.RespondSuccess(w, http.StatusCreated, attempt, "Quiz attempt started successfully")
}

// SubmitAnswer submits an answer for a question
func (h *AttemptHandler) SubmitAnswer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	attemptID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid attempt ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var req SubmitAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get attempt
	var attempt models.QuizAttempt
	if err := database.DB.First(&attempt, attemptID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz attempt not found")
		return
	}

	// Verify user owns this attempt
	if attempt.UserID != user.ID {
		utils.RespondError(w, http.StatusForbidden, "Not authorized to submit answer for this attempt")
		return
	}

	// Check if attempt is still in progress
	if attempt.Status != models.AttemptStatusInProgress {
		utils.RespondError(w, http.StatusBadRequest, "Quiz attempt is not in progress")
		return
	}

	// Verify question belongs to the quiz
	var question models.Question
	if err := database.DB.Where("id = ? AND quiz_id = ?", req.QuestionID, attempt.QuizID).First(&question).Error; err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Question not found or does not belong to this quiz")
		return
	}

	// Check if answer already exists, update if so
	var answer models.Answer
	result := database.DB.Where("quiz_attempt_id = ? AND question_id = ?", attemptID, req.QuestionID).First(&answer)

	if result.Error == nil {
		// Update existing answer
		answer.SelectedOptionID = req.SelectedOptionID
		answer.TimeTaken = req.TimeTaken
		if err := database.DB.Save(&answer).Error; err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to update answer")
			return
		}
	} else if result.Error.Error() == "record not found" {
		// Create new answer (this is the normal case for first-time answers)
		answer = models.Answer{
			QuizAttemptID:    attemptID,
			QuestionID:       req.QuestionID,
			SelectedOptionID: req.SelectedOptionID,
			TimeTaken:        req.TimeTaken,
		}
		if err := database.DB.Create(&answer).Error; err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to save answer")
			return
		}
	} else {
		// Actual database error
		utils.RespondError(w, http.StatusInternalServerError, "Database error checking existing answer")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, answer, "Answer submitted successfully")
}

// SubmitAttempt finalizes a quiz attempt and calculates score
func (h *AttemptHandler) SubmitAttempt(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	attemptID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid attempt ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// Get attempt
	var attempt models.QuizAttempt
	if err := database.DB.First(&attempt, attemptID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz attempt not found")
		return
	}

	// Verify user owns this attempt
	if attempt.UserID != user.ID {
		utils.RespondError(w, http.StatusForbidden, "Not authorized to submit this attempt")
		return
	}

	// Check if already submitted
	if attempt.Status != models.AttemptStatusInProgress {
		utils.RespondError(w, http.StatusBadRequest, "Quiz attempt already submitted")
		return
	}

	// Calculate score
	score, err := h.calculateScore(attemptID)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to calculate score")
		return
	}

	// Update attempt
	now := time.Now()
	attempt.FinishedAt = &now
	attempt.Score = score
	attempt.Status = models.AttemptStatusGraded

	if err := database.DB.Save(&attempt).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to submit quiz attempt")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, attempt, "Quiz submitted successfully")
}

// GetAttempt returns details of a quiz attempt
func (h *AttemptHandler) GetAttempt(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	attemptID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid attempt ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var attempt models.QuizAttempt
	query := database.DB.Preload("Quiz").Preload("Quiz.Subject")

	// Students can only see their own attempts
	if user.Role == models.RoleStudent {
		query = query.Where("user_id = ?", user.ID)
	}

	if err := query.First(&attempt, attemptID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz attempt not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, attempt, "")
}

// GetAttemptResult returns detailed result with answers and correct answers
func (h *AttemptHandler) GetAttemptResult(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	attemptID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid attempt ID")
		return
	}

	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var attempt models.QuizAttempt
	query := database.DB.Preload("Quiz").Preload("Quiz.Subject").Preload("User")

	// Students can only see their own attempts
	if user.Role == models.RoleStudent {
		query = query.Where("user_id = ?", user.ID)
	}

	if err := query.First(&attempt, attemptID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz attempt not found")
		return
	}

	// Only show results if attempt is completed
	if attempt.Status == models.AttemptStatusInProgress {
		utils.RespondError(w, http.StatusBadRequest, "Quiz attempt is still in progress")
		return
	}

	// Get all questions for this quiz
	var allQuestions []models.Question
	if err := database.DB.Where("quiz_id = ?", attempt.QuizID).
		Preload("Options").
		Order("id").
		Find(&allQuestions).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch questions")
		return
	}

	// Get all answers for this attempt
	var answers []models.Answer
	database.DB.Where("quiz_attempt_id = ?", attemptID).
		Preload("Question").
		Preload("Question.Options").
		Preload("SelectedOption").
		Find(&answers)

	// Create a map of answers by question ID for quick lookup
	answerMap := make(map[uuid.UUID]*models.Answer)
	for i := range answers {
		answerMap[answers[i].QuestionID] = &answers[i]
	}

	// Build detailed response for all questions
	answerDetails := make([]models.AnswerDetail, len(allQuestions))
	for i, question := range allQuestions {
		// Find correct option
		var correctOptionText string
		for _, opt := range question.Options {
			if opt.IsCorrect {
				correctOptionText = opt.Text
				break
			}
		}

		// Check if this question was answered
		answer, wasAnswered := answerMap[question.ID]

		selectedText := ""
		isCorrect := false
		var timeTaken *int
		var answerValue models.Answer

		if wasAnswered && answer != nil {
			answerValue = *answer // Dereference the pointer
			if answer.SelectedOption != nil {
				selectedText = answer.SelectedOption.Text
				isCorrect = answer.SelectedOption.IsCorrect
			}
			timeTaken = answer.TimeTaken
		} else {
			// Create a zero-value Answer struct for unanswered questions
			answerValue = models.Answer{
				QuizAttemptID: attemptID,
				QuestionID:    question.ID,
			}
		}

		answerDetails[i] = models.AnswerDetail{
			Answer:             answerValue,
			QuestionText:       question.Text,
			SelectedOptionText: selectedText,
			IsCorrect:          isCorrect,
			CorrectOptionText:  correctOptionText,
			TimeTaken:          timeTaken,
			WasAnswered:        wasAnswered,
		}
	}

	result := models.QuizAttemptWithDetails{
		QuizAttempt: attempt,
		QuizTitle:   attempt.Quiz.Title,
		SubjectName: attempt.Quiz.Subject.Name,
		StudentName: attempt.User.Name,
		StudentID:   attempt.User.StudentID,
		Answers:     answerDetails,
	}

	utils.RespondSuccess(w, http.StatusOK, result, "")
}

// GetMyAttempts returns all attempts for the current user
func (h *AttemptHandler) GetMyAttempts(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	var attempts []models.QuizAttempt
	if err := database.DB.Where("user_id = ?", user.ID).
		Preload("Quiz").
		Preload("Quiz.Subject").
		Order("created_at DESC").
		Find(&attempts).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch attempts")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, attempts, "")
}

// GetAllAttempts returns all attempts (Admin only)
func (h *AttemptHandler) GetAllAttempts(w http.ResponseWriter, r *http.Request) {
	// Get query parameters for filtering
	quizID := r.URL.Query().Get("quiz_id")

	query := database.DB.Preload("Quiz").Preload("Quiz.Subject").Preload("User")

	if quizID != "" {
		parsedQuizID, err := uuid.Parse(quizID)
		if err == nil {
			query = query.Where("quiz_id = ?", parsedQuizID)
		}
	}

	var attempts []models.QuizAttempt
	if err := query.Order("created_at DESC").Find(&attempts).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to fetch attempts")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, attempts, "")
}

// calculateScore calculates the score for a quiz attempt
func (h *AttemptHandler) calculateScore(attemptID uuid.UUID) (float64, error) {
	// Get the attempt to find the quiz
	var attempt models.QuizAttempt
	if err := database.DB.First(&attempt, attemptID).Error; err != nil {
		return 0, err
	}

	// Get total number of questions in the quiz
	var questionCount int64
	if err := database.DB.Model(&models.Question{}).Where("quiz_id = ?", attempt.QuizID).Count(&questionCount).Error; err != nil {
		return 0, err
	}

	if questionCount == 0 {
		return 0, nil
	}

	// Get all answers for this attempt
	var answers []models.Answer
	if err := database.DB.Where("quiz_attempt_id = ?", attemptID).
		Preload("SelectedOption").
		Find(&answers).Error; err != nil {
		return 0, err
	}

	// Count correct answers
	correctCount := 0
	for _, ans := range answers {
		if ans.SelectedOption != nil && ans.SelectedOption.IsCorrect {
			correctCount++
		}
	}

	// Calculate percentage based on total questions, not just answered questions
	score := (float64(correctCount) / float64(questionCount)) * 100.0
	return score, nil
}
