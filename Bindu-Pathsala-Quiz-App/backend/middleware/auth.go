package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/quiz-hosting-app/backend/utils"
)

type contextKey string

const UserContextKey contextKey = "user"

// getStringClaim safely extracts a string claim from JWT token claims
func getStringClaim(claims jwt.MapClaims, key string) string {
	if val, exists := claims[key]; exists && val != nil {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return "" // Return empty string for missing or invalid claims
	}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.RespondError(w, http.StatusUnauthorized, "Authorization header required")
				return
			}

			// Extract token from "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				utils.RespondError(w, http.StatusUnauthorized, "Invalid authorization header format")
				return
			}

			tokenString := parts[1]

			// Parse and validate token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				utils.RespondError(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			// Extract claims
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				utils.RespondError(w, http.StatusUnauthorized, "Invalid token claims")
				return
			}

			// Extract user info from claims
			userID, err := uuid.Parse(getStringClaim(claims, "user_id"))
			if err != nil {
				utils.RespondError(w, http.StatusUnauthorized, "Invalid user ID in token")
				return
			}

			user := &models.User{
				ID:        userID,
				StudentID: getStringClaim(claims, "student_id"),
				Name:      getStringClaim(claims, "name"),
				Email:     getStringClaim(claims, "email"), // Email may be missing from old tokens
				Role:      models.UserRole(getStringClaim(claims, "role")),
				Batch:     getStringClaim(claims, "batch"), // Extract batch from JWT token (may be nil for old tokens)
			}

			// Add user to context
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole middleware ensures user has required role
func RequireRole(roles ...models.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := r.Context().Value(UserContextKey).(*models.User)
			if !ok {
				utils.RespondError(w, http.StatusUnauthorized, "User not found in context")
				return
			}

			// Check if user has any of the required roles
			hasRole := false
			for _, role := range roles {
				if user.Role == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserFromContext retrieves user from request context
func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	return user, ok
}
