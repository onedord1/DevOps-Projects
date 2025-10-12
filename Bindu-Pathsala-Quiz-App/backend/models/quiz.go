package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QuizStatus string

const (
	QuizStatusDraft     QuizStatus = "draft"
	QuizStatusPublished QuizStatus = "published"
	QuizStatusClosed    QuizStatus = "closed"
)

type Quiz struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SubjectID        uuid.UUID  `gorm:"type:uuid;not null" json:"subject_id"`
	Title            string     `gorm:"type:varchar(255);not null" json:"title"`
	Description      string     `gorm:"type:text" json:"description"`
	StartTime        time.Time  `gorm:"not null" json:"start_time"`
	EndTime          time.Time  `gorm:"not null" json:"end_time"`
	TotalQuestions   int        `gorm:"default:0" json:"total_questions"`
	TimePerQuestion  *int       `gorm:"type:integer" json:"time_per_question"` // in seconds, nullable
	AllowedTime      *int       `gorm:"type:integer" json:"allowed_time"`      // total time in seconds, nullable
	RandomizeOrder   bool       `gorm:"default:false" json:"randomize_order"`
	Status           QuizStatus `gorm:"type:quiz_status;default:'draft'" json:"status"`
	CreatedAt        time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Associations
	Subject      Subject       `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Questions    []Question    `gorm:"foreignKey:QuizID" json:"questions,omitempty"`
	QuizAttempts []QuizAttempt `gorm:"foreignKey:QuizID" json:"quiz_attempts,omitempty"`
}

// BeforeCreate hook
func (q *Quiz) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

// IsAvailable checks if quiz is currently available for taking (ignoring sessions)
func (q *Quiz) IsAvailable() bool {
	now := time.Now()
	return q.Status == QuizStatusPublished &&
		now.After(q.StartTime) &&
		now.Before(q.EndTime)
}

// QuizWithAttemptCount represents a quiz with attempt statistics
type QuizWithAttemptCount struct {
	Quiz
	AttemptCount int `json:"attempt_count"`
}
