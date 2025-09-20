package models

import (
    "time"

    "gorm.io/gorm"
)

type Transaction struct {
    ID          uint           `json:"id" gorm:"primaryKey"`
    UserID      uint           `json:"user_id" gorm:"not null"`
    CategoryID  uint           `json:"category_id" gorm:"not null"`
    Amount      float64        `json:"amount" gorm:"not null"`
    Currency    string         `json:"currency" gorm:"not null;default:USD"`
    Date        time.Time      `json:"date" gorm:"not null"`
    Description string         `json:"description"`
    ReceiptURL  string         `json:"receipt_url" gorm:"column:receipt_url"`
    RecurringID *uint          `json:"recurring_id" gorm:"column:recurring_id"` // Foreign key to RecurringExpense
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

    // Relations
    User      User              `json:"-" gorm:"foreignKey:UserID"`
    Category  Category          `json:"category" gorm:"foreignKey:CategoryID"`
    Recurring *RecurringExpense `json:"recurring,omitempty" gorm:"foreignKey:RecurringID"`
    Tags      []Tag             `json:"tags" gorm:"many2many:transaction_tags;"`
}