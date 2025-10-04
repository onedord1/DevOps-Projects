package handler

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/your-org/monitoring-dashboard/internal/auth-service/service"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
}

func (h *UserHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.Register(c.Request.Context(), req.Username, req.Email, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully"})
}

func (h *UserHandler) Login(c *gin.Context) {
	// --- Start of Logging ---
	// Read the body to log it for debugging
	bodyBytes, err := ioutil.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Auth Service: Error reading request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	bodyString := string(bodyBytes)
	log.Printf("Auth Service: Received request body: %s", bodyString)

	// IMPORTANT: Re-create a reader for the body so c.ShouldBindJSON can still read it
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
	// --- End of Logging ---

	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Auth Service: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Auth Service: Login attempt for user: %s", req.Username)

	token, err := h.userService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		log.Printf("Auth Service: Login failed for user %s: %v", req.Username, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	log.Printf("Auth Service: Login successful for user: %s", req.Username)
	c.JSON(http.StatusOK, AuthResponse{Token: token})
}
