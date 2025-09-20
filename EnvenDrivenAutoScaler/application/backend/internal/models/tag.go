package models

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    UserID    *uint          `gorm:"index;foreignKey:User;constraint:OnDelete:CASCADE" json:"user_id"`
    User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
    Name      string         `gorm:"not null;uniqueIndex:idx_tags_user_name" json:"name"`
    Color     string         `gorm:"not null;size:7" json:"color"` // Hex color code
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}