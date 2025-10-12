package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AttemptStatus string

const (
	AttemptStatusInProgress AttemptStatus = "in_progress"
	AttemptStatusSubmitted  AttemptStatus = "submitted"
	AttemptStatusGraded     AttemptStatus = "graded"
)

type QuizAttempt struct {
	ID         uuid.UUID     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	QuizID     uuid.UUID     `gorm:"type:uuid;not null" json:"quiz_id"`
	UserID     uuid.UUID     `gorm:"type:uuid;not null" json:"user_id"`
	SessionID  *uuid.UUID    `gorm:"type:uuid" json:"session_id"` // nullable for backward compatibility
	StartedAt  time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"started_at"`
	FinishedAt *time.Time    `gorm:"type:timestamp" json:"finished_at"`
	Score      float64       `gorm:"type:decimal(5,2);default:0.00" json:"score"`
	Status     AttemptStatus `gorm:"type:attempt_status;default:'in_progress'" json:"status"`
	CreatedAt  time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt  time.Time     `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Associations
	Quiz    Quiz     `gorm:"foreignKey:QuizID" json:"quiz,omitempty"`
	User    User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Session *QuizSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	Answers []Answer `gorm:"foreignKey:QuizAttemptID" json:"answers,omitempty"`
}

// BeforeCreate hook
func (qa *QuizAttempt) BeforeCreate(tx *gorm.DB) error {
	if qa.ID == uuid.Nil {
		qa.ID = uuid.New()
	}
	return nil
}

type Answer struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	QuizAttemptID    uuid.UUID  `gorm:"type:uuid;not null" json:"quiz_attempt_id"`
	QuestionID       uuid.UUID  `gorm:"type:uuid;not null" json:"question_id"`
	SelectedOptionID *uuid.UUID `gorm:"type:uuid" json:"selected_option_id"` // nullable
	TimeTaken        *int       `gorm:"type:integer" json:"time_taken"`      // in seconds, nullable
	CreatedAt        time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	// Associations
	QuizAttempt    QuizAttempt `gorm:"foreignKey:QuizAttemptID" json:"quiz_attempt,omitempty"`
	Question       Question    `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
	SelectedOption *Option     `gorm:"foreignKey:SelectedOptionID" json:"selected_option,omitempty"`
}

// BeforeCreate hook
func (a *Answer) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// QuizAttemptWithDetails includes related data for display
type QuizAttemptWithDetails struct {
	QuizAttempt
	QuizTitle   string       `json:"quiz_title"`
	SubjectName string       `json:"subject_name"`
	StudentName string       `json:"student_name"`
	StudentID   string       `json:"student_id"`
	Answers     []AnswerDetail `json:"answers,omitempty"`
}

type AnswerDetail struct {
	Answer
	QuestionText       string `json:"question_text"`
	SelectedOptionText string `json:"selected_option_text"`
	IsCorrect          bool   `json:"is_correct"`
	CorrectOptionText  string `json:"correct_option_text"`
	TimeTaken          *int   `json:"time_taken"`
	WasAnswered        bool   `json:"was_answered"`
}
