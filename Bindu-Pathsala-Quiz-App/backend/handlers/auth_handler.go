package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/middleware"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
)

type AuthHandler struct {
	config *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{config: cfg}
}

type RegisterRequest struct {
	StudentID string  `json:"student_id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	Password  string  `json:"password"`
	Batch     string  `json:"batch"` // optional batch assignment
}

type LoginRequest struct {
	StudentID string `json:"student_id"`
	Password  string `json:"password"`
}

type AuthResponse struct {
	Token string               `json:"token"`
	User  models.UserResponse  `json:"user"`
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Trim whitespace from inputs
	req.StudentID = strings.TrimSpace(req.StudentID)
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	// Validate input
	if req.StudentID == "" || req.Name == "" || req.Password == "" {
		utils.RespondError(w, http.StatusBadRequest, "Student ID, name, and password are required")
		return
	}

	// Check if student ID already exists
	var existingUser models.User
	if err := database.DB.Where("student_id = ?", req.StudentID).First(&existingUser).Error; err == nil {
		utils.RespondError(w, http.StatusConflict, "Student ID already exists")
		return
	}

	// Check if email already exists (if provided)
	if req.Email != "" {
		if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			utils.RespondError(w, http.StatusConflict, "Email already exists")
			return
		}
	}

	// Create new user
	user := models.User{
		StudentID: req.StudentID,
		Name:      req.Name,
		Email:     req.Email,
		Role:      models.RoleStudent,
		Batch:     req.Batch,
	}

	if err := user.HashPassword(req.Password); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(&user, h.config.JWT.Secret, h.config.JWT.ExpiryHours)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	response := AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	utils.RespondSuccess(w, http.StatusCreated, response, "User registered successfully")
}

// Login handles user authentication
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Trim whitespace from inputs
	req.StudentID = strings.TrimSpace(req.StudentID)
	req.Password = strings.TrimSpace(req.Password)

	// Validate input
	if req.StudentID == "" || req.Password == "" {
		utils.RespondError(w, http.StatusBadRequest, "Student ID and password are required")
		return
	}

	// Find user by student ID
	var user models.User
	if err := database.DB.Where("student_id = ?", req.StudentID).First(&user).Error; err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Verify password
	if !user.CheckPassword(req.Password) {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(&user, h.config.JWT.Secret, h.config.JWT.ExpiryHours)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	response := AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	utils.RespondSuccess(w, http.StatusOK, response, "Login successful")
}

// GetMe returns the current authenticated user
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// Fetch full user details from database
	var fullUser models.User
	if err := database.DB.Where("id = ?", user.ID).First(&fullUser).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "User not found")
		return
	}

	utils.RespondSuccess(w, http.StatusOK, fullUser.ToResponse(), "")
}
