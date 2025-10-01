package models

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	Name      string         `json:"name" gorm:"not null"`
	Type      CategoryType   `json:"type" gorm:"not null"`
	Color     string         `json:"color" gorm:"default:#6B7280"`
	Icon      string         `json:"icon" gorm:"default:💰"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	User         User          `json:"-"`
	Transactions []Transaction `json:"transactions,omitempty"`
	Budgets      []Budget      `json:"budgets,omitempty"`
}

type CategoryType string

const (
	CategoryTypeExpense CategoryType = "expense"
	CategoryTypeIncome  CategoryType = "income"
)
