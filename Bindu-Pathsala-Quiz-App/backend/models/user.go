package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleStudent UserRole = "student"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	StudentID    string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"student_id"`
	Name         string    `gorm:"type:varchar(255);not null" json:"name"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         UserRole  `gorm:"type:user_role;default:'student'" json:"role"`
	Batch        *string   `gorm:"type:varchar(100)" json:"batch"` // nullable, for students only
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Associations
	QuizAttempts []QuizAttempt `gorm:"foreignKey:UserID" json:"quiz_attempts,omitempty"`
}

// BeforeCreate hook
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// HashPassword hashes the user's password
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword verifies the password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// UserResponse represents user data without sensitive information
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	StudentID string    `json:"student_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      UserRole  `json:"role"`
	Batch     *string   `json:"batch"`
	CreatedAt time.Time `json:"created_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		StudentID: u.StudentID,
		Name:      u.Name,
		Email:     u.Email,
		Role:      u.Role,
		Batch:     u.Batch,
		CreatedAt: u.CreatedAt,
	}
}
