package utils

import (
	"testing"

	"github.com/google/uuid"
	"github.com/quiz-hosting-app/backend/models"
)

func TestGenerateJWT(t *testing.T) {
	user := &models.User{
		ID:        uuid.New(),
		StudentID: "TEST001",
		Name:      "Test User",
		Email:     "test@example.com",
		Role:      models.RoleStudent,
	}

	secret := "test-secret"
	expiryHours := 24

	token, err := GenerateJWT(user, secret, expiryHours)
	if err != nil {
		t.Errorf("GenerateJWT() error = %v", err)
		return
	}

	if token == "" {
		t.Error("GenerateJWT() returned empty token")
	}
}

func TestGenerateJWT_DifferentRoles(t *testing.T) {
	tests := []struct {
		name string
		role models.UserRole
	}{
		{
			name: "Student role",
			role: models.RoleStudent,
		},
		{
			name: "Admin role",
			role: models.RoleAdmin,
		},
	}

	secret := "test-secret"
	expiryHours := 24

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := &models.User{
				ID:        uuid.New(),
				StudentID: "TEST001",
				Name:      "Test User",
				Email:     "test@example.com",
				Role:      tt.role,
			}

			token, err := GenerateJWT(user, secret, expiryHours)
			if err != nil {
				t.Errorf("GenerateJWT() error = %v", err)
				return
			}

			if token == "" {
				t.Errorf("GenerateJWT() returned empty token for role %s", tt.role)
			}
		})
	}
}
