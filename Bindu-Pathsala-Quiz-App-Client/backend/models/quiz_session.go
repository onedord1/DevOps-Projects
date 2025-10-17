package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// QuizSession represents a scheduled instance of a quiz for a specific batch/time slot
type QuizSession struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	QuizID      uuid.UUID  `gorm:"type:uuid;not null" json:"quiz_id"`
	BatchName   string     `gorm:"type:varchar(255);not null" json:"batch_name"`
	StartTime   time.Time  `gorm:"not null" json:"start_time"`
	EndTime     time.Time  `gorm:"not null" json:"end_time"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Associations
	Quiz         Quiz          `gorm:"foreignKey:QuizID" json:"quiz,omitempty"`
	QuizAttempts []QuizAttempt `gorm:"foreignKey:SessionID" json:"quiz_attempts,omitempty"`
}

// BeforeCreate hook
func (qs *QuizSession) BeforeCreate(tx *gorm.DB) error {
	if qs.ID == uuid.Nil {
		qs.ID = uuid.New()
	}
	return nil
}

// IsAvailable checks if session is currently available
func (qs *QuizSession) IsAvailable() bool {
	now := time.Now()
	return qs.IsActive &&
		now.After(qs.StartTime) &&
		now.Before(qs.EndTime)
}

// QuizSessionResponse represents quiz session data for API responses
type QuizSessionResponse struct {
	ID        uuid.UUID `json:"id"`
	QuizID    uuid.UUID `json:"quiz_id"`
	BatchName string    `json:"batch_name"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	IsActive  bool      `json:"is_active"`
	Quiz      *Quiz     `json:"quiz,omitempty"`
}

// ToResponse converts QuizSession to QuizSessionResponse
func (qs *QuizSession) ToResponse() QuizSessionResponse {
	return QuizSessionResponse{
		ID:        qs.ID,
		QuizID:    qs.QuizID,
		BatchName: qs.BatchName,
		StartTime: qs.StartTime,
		EndTime:   qs.EndTime,
		IsActive:  qs.IsActive,
		Quiz:      &qs.Quiz,
	}
}
