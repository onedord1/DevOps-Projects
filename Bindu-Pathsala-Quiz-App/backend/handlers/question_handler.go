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

type QuestionHandler struct{}

func NewQuestionHandler() *QuestionHandler {
	return &QuestionHandler{}
}

type CreateQuestionRequest struct {
	QuizID    uuid.UUID       `json:"quiz_id"`
	Text      string          `json:"text"`
	TimeLimit *int            `json:"time_limit"`
	Options   []OptionRequest `json:"options"`
}

type OptionRequest struct {
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
}

type UpdateQuestionRequest struct {
	Text      string          `json:"text"`
	TimeLimit *int            `json:"time_limit"`
	Options   []OptionRequest `json:"options"`
}

// CreateQuestion creates a new question with options (Admin only)
func (h *QuestionHandler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	var req CreateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Text == "" {
		utils.RespondError(w, http.StatusBadRequest, "Question text is required")
		return
	}

	if len(req.Options) < 2 {
		utils.RespondError(w, http.StatusBadRequest, "At least 2 options are required")
		return
	}

	// Verify at least one correct answer
	hasCorrect := false
	for _, opt := range req.Options {
		if opt.IsCorrect {
			hasCorrect = true
			break
		}
	}
	if !hasCorrect {
		utils.RespondError(w, http.StatusBadRequest, "At least one option must be correct")
		return
	}

	// Verify quiz exists
	var quiz models.Quiz
	if err := database.DB.First(&quiz, req.QuizID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Quiz not found")
		return
	}

	// Create question
	question := models.Question{
		QuizID:    req.QuizID,
		Text:      req.Text,
		TimeLimit: req.TimeLimit,
	}

	if err := database.DB.Create(&question).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create question")
		return
	}

	// Create options
	for _, optReq := range req.Options {
		option := models.Option{
			QuestionID: question.ID,
			Text:       optReq.Text,
			IsCorrect:  optReq.IsCorrect,
		}
		if err := database.DB.Create(&option).Error; err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to create option")
			return
		}
	}

	// Update quiz total_questions count
	var count int64
	database.DB.Model(&models.Question{}).Where("quiz_id = ?", quiz.ID).Count(&count)
	quiz.TotalQuestions = int(count)
	database.DB.Save(&quiz)

	// Load options for response
	database.DB.Preload("Options").First(&question, question.ID)

	utils.RespondSuccess(w, http.StatusCreated, question, "Question created successfully")
}

// UpdateQuestion updates an existing question (Admin only)
func (h *QuestionHandler) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	questionID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid question ID")
		return
	}

	var req UpdateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var question models.Question
	if err := database.DB.First(&question, questionID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Question not found")
		return
	}

	// Update question
	if req.Text != "" {
		question.Text = req.Text
	}
	question.TimeLimit = req.TimeLimit

	if err := database.DB.Save(&question).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to update question")
		return
	}

	// Update options if provided
	if len(req.Options) > 0 {
		// Verify at least one correct answer
		hasCorrect := false
		for _, opt := range req.Options {
			if opt.IsCorrect {
				hasCorrect = true
				break
			}
		}
		if !hasCorrect {
			utils.RespondError(w, http.StatusBadRequest, "At least one option must be correct")
			return
		}

		// Delete existing options
		database.DB.Where("question_id = ?", questionID).Delete(&models.Option{})

		// Create new options
		for _, optReq := range req.Options {
			option := models.Option{
				QuestionID: question.ID,
				Text:       optReq.Text,
				IsCorrect:  optReq.IsCorrect,
			}
			if err := database.DB.Create(&option).Error; err != nil {
				utils.RespondError(w, http.StatusInternalServerError, "Failed to create option")
				return
			}
		}
	}

	// Load options for response
	database.DB.Preload("Options").First(&question, question.ID)

	utils.RespondSuccess(w, http.StatusOK, question, "Question updated successfully")
}

// DeleteQuestion deletes a question (Admin only)
func (h *QuestionHandler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	questionID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid question ID")
		return
	}

	var question models.Question
	if err := database.DB.First(&question, questionID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Question not found")
		return
	}

	quizID := question.QuizID

	if err := database.DB.Delete(&question).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete question")
		return
	}

	// Update quiz total_questions count
	var quiz models.Quiz
	if database.DB.First(&quiz, quizID).Error == nil {
		var count int64
		database.DB.Model(&models.Question{}).Where("quiz_id = ?", quizID).Count(&count)
		quiz.TotalQuestions = int(count)
		database.DB.Save(&quiz)
	}

	utils.RespondSuccess(w, http.StatusOK, nil, "Question deleted successfully")
}

// GetQuestion returns a specific question with options (Admin only)
func (h *QuestionHandler) GetQuestion(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	questionID, err := uuid.Parse(vars["id"])
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid question ID")
		return
	}

	var question models.Question
	if err := database.DB.Preload("Options").First(&question, questionID).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Question not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, question, "")
}
