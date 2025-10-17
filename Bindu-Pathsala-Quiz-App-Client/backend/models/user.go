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

type UserStatus string

const (
	StatusPending  UserStatus = "pending"
	StatusApproved UserStatus = "approved"
	StatusRejected UserStatus = "rejected"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	StudentID    string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"student_id"`
	Name         string    `gorm:"type:varchar(255);not null" json:"name"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	Phone        string    `gorm:"type:varchar(20)" json:"phone"`
	Address      string    `gorm:"type:text" json:"address"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         UserRole  `gorm:"type:varchar(20);default:'student'" json:"role"`
	Status       UserStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Batch        string    `gorm:"type:varchar(100)" json:"batch"` // for students only
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
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	Role      UserRole  `json:"role"`
	Status    UserStatus `json:"status"`
	Batch     string    `json:"batch"`
	CreatedAt time.Time `json:"created_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		StudentID: u.StudentID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		Address:   u.Address,
		Role:      u.Role,
		Status:    u.Status,
		Batch:     u.Batch,
		CreatedAt: u.CreatedAt,
	}
}
