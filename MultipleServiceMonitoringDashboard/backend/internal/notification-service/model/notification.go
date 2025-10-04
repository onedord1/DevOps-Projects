package model

import (
    "time"

    "github.com/google/uuid"
)

type NotificationChannel struct {
    ID        uuid.UUID `json:"id" db:"id"`
    Name      string    `json:"name" db:"name"`
    Type      string    `json:"type" db:"type"` // "slack", "email", "webhook"
    Config    string    `json:"config" db:"config"` // JSON string
    Enabled   bool      `json:"enabled" db:"enabled"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type NotificationTemplate struct {
    ID             uuid.UUID `json:"id" db:"id"`
    EventType      string    `json:"event_type" db:"event_type"`
    SubjectTemplate *string   `json:"subject_template" db:"subject_template"`
    BodyTemplate   string    `json:"body_template" db:"body_template"`
    IsDefault      bool      `json:"default_template" db:"default_template"`
    CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

type NotificationRecord struct {
    ID          uuid.UUID  `json:"id" db:"id"`
    EventID     uuid.UUID  `json:"event_id" db:"event_id"`
    ChannelID   uuid.UUID  `json:"channel_id" db:"channel_id"`
    EventType   string     `json:"event_type" db:"event_type"`
    Status      string     `json:"status" db:"status"` // "pending", "sent", "failed"
    ErrorMessage *string    `json:"error_message" db:"error_message"`
    SentAt      *time.Time `json:"sent_at" db:"sent_at"`
    CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}