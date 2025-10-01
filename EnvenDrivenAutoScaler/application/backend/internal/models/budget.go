package models

import (
	"time"

	"gorm.io/gorm"
)

type Budget struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	UserID     uint           `json:"user_id" gorm:"not null"`
	CategoryID *uint          `json:"category_id"` // null for overall budget
	Amount     float64        `json:"amount" gorm:"not null"`
	Currency   string         `json:"currency" gorm:"not null;default:USD"`
	Period     BudgetPeriod   `json:"period" gorm:"not null"`
	StartDate  time.Time      `json:"start_date" gorm:"not null"`
	EndDate    time.Time      `json:"end_date" gorm:"not null"`
	IsActive   bool           `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
	User     User      `json:"-"`
	Category *Category `json:"category,omitempty"`
}

type BudgetPeriod string

const (
	BudgetPeriodWeekly  BudgetPeriod = "weekly"
	BudgetPeriodMonthly BudgetPeriod = "monthly"
	BudgetPeriodYearly  BudgetPeriod = "yearly"
)
