package models

import (
	"time"

	"gorm.io/gorm"
)

type RecurringExpense struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	UserID       uint           `json:"user_id" gorm:"not null"`
	CategoryID   uint           `json:"category_id" gorm:"not null"`
	Amount       float64        `json:"amount" gorm:"not null"`
	Currency     string         `json:"currency" gorm:"not null;default:USD"`
	Description  string         `json:"description"`
	Frequency    RecurringFreq  `json:"frequency" gorm:"not null"`
	NextDueDate  time.Time      `json:"next_due_date" gorm:"not null"`
	LastExecuted *time.Time     `json:"last_executed"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	User         User          `json:"-" gorm:"foreignKey:UserID"`
	Category     Category      `json:"category" gorm:"foreignKey:CategoryID"`
	Transactions []Transaction `json:"transactions,omitempty" gorm:"foreignKey:RecurringID"`
}

type RecurringFreq string

const (
	RecurringDaily   RecurringFreq = "daily"
	RecurringWeekly  RecurringFreq = "weekly"
	RecurringMonthly RecurringFreq = "monthly"
	RecurringYearly  RecurringFreq = "yearly"
)
