package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/models"
)

func TestAuthHandler_Register(t *testing.T) {
	// This is a basic test structure
	// In a real application, you would mock the database

	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:      "test-secret",
			ExpiryHours: 24,
		},
	}

	handler := NewAuthHandler(cfg)

	tests := []struct {
		name           string
		requestBody    RegisterRequest
		expectedStatus int
	}{
		{
			name: "Valid registration",
			requestBody: RegisterRequest{
				StudentID: "TEST001",
				Name:      "Test User",
				Email:     "test@example.com",
				Password:  "password123",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "Missing required fields",
			requestBody: RegisterRequest{
				StudentID: "",
				Name:      "Test User",
				Password:  "password123",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			
			// Note: This test would need a mock database to actually work
			// For now, it demonstrates the test structure
			_ = handler
			_ = rr
		})
	}
}

func TestUserModel_HashPassword(t *testing.T) {
	user := &models.User{}
	password := "testpassword123"

	err := user.HashPassword(password)
	if err != nil {
		t.Errorf("HashPassword() error = %v", err)
		return
	}

	if user.PasswordHash == "" {
		t.Error("HashPassword() did not set password hash")
	}

	if user.PasswordHash == password {
		t.Error("HashPassword() did not hash the password")
	}
}

func TestUserModel_CheckPassword(t *testing.T) {
	user := &models.User{}
	password := "testpassword123"

	err := user.HashPassword(password)
	if err != nil {
		t.Fatalf("Setup failed: %v", err)
	}

	tests := []struct {
		name     string
		password string
		expected bool
	}{
		{
			name:     "Correct password",
			password: password,
			expected: true,
		},
		{
			name:     "Incorrect password",
			password: "wrongpassword",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := user.CheckPassword(tt.password)
			if result != tt.expected {
				t.Errorf("CheckPassword() = %v, want %v", result, tt.expected)
			}
		})
	}
}
