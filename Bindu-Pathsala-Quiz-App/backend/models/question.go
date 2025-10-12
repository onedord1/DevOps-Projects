package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Question struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	QuizID    uuid.UUID `gorm:"type:uuid;not null" json:"quiz_id"`
	Text      string    `gorm:"type:text;not null" json:"text"`
	TimeLimit *int      `gorm:"type:integer" json:"time_limit"` // Optional per-question override
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Associations
	Quiz    Quiz     `gorm:"foreignKey:QuizID" json:"quiz,omitempty"`
	Options []Option `gorm:"foreignKey:QuestionID" json:"options,omitempty"`
	Answers []Answer `gorm:"foreignKey:QuestionID" json:"answers,omitempty"`
}

// BeforeCreate hook
func (q *Question) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}

type Option struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	QuestionID uuid.UUID `gorm:"type:uuid;not null" json:"question_id"`
	Text       string    `gorm:"type:text;not null" json:"text"`
	IsCorrect  bool      `gorm:"default:false" json:"is_correct"`
	CreatedAt  time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	// Associations
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// BeforeCreate hook
func (o *Option) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// QuestionWithoutCorrectAnswers represents a question without revealing correct answers
type QuestionWithoutCorrectAnswers struct {
	ID        uuid.UUID                `json:"id"`
	QuizID    uuid.UUID                `json:"quiz_id"`
	Text      string                   `json:"text"`
	TimeLimit *int                     `json:"time_limit"`
	Options   []OptionWithoutIsCorrect `json:"options"`
}

type OptionWithoutIsCorrect struct {
	ID   uuid.UUID `json:"id"`
	Text string    `json:"text"`
}

// ToQuestionWithoutCorrectAnswers converts Question to QuestionWithoutCorrectAnswers
func (q *Question) ToQuestionWithoutCorrectAnswers() QuestionWithoutCorrectAnswers {
	options := make([]OptionWithoutIsCorrect, len(q.Options))
	for i, opt := range q.Options {
		options[i] = OptionWithoutIsCorrect{
			ID:   opt.ID,
			Text: opt.Text,
		}
	}
	return QuestionWithoutCorrectAnswers{
		ID:        q.ID,
		QuizID:    q.QuizID,
		Text:      q.Text,
		TimeLimit: q.TimeLimit,
		Options:   options,
	}
}
