package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/quiz-hosting-app/backend/models"
)

// GenerateJWT generates a JWT token for a user
func GenerateJWT(user *models.User, secret string, expiryHours int) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    user.ID.String(),
		"student_id": user.StudentID,
		"name":       user.Name,
		"email":      user.Email,
		"phone":      user.Phone,
		"address":    user.Address,
		"role":       string(user.Role),
		"batch":      user.Batch, // Include batch in JWT token
		"exp":        time.Now().Add(time.Hour * time.Duration(expiryHours)).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
