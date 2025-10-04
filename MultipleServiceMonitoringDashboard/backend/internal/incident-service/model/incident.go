package model

import (
    "time"

    "github.com/google/uuid"
)

type Incident struct {
    ID              uuid.UUID  `json:"id" db:"id"`
    Title           string     `json:"title" db:"title"`
    Description     string     `json:"description" db:"description"`
    Status          string     `json:"status" db:"status"` // "open", "in_progress", "resolved"
    Severity        string     `json:"severity" db:"severity"`
    CreatedAt       time.Time  `json:"created_at" db:"created_at"`
    ResolvedAt      *time.Time `json:"resolved_at" db:"resolved_at"`
    RelatedAlertIDs []uuid.UUID `json:"related_alert_ids" db:"related_alert_ids"`
}

type IncidentEvent struct {
    ID         uuid.UUID `json:"id" db:"id"`
    IncidentID uuid.UUID `json:"incident_id" db:"incident_id"`
    Timestamp  time.Time `json:"timestamp" db:"timestamp"`
    EventType  string    `json:"event_type" db:"event_type"`
    Payload    string    `json:"payload" db:"payload"` // JSON string
}

type IncidentComment struct {
    ID         uuid.UUID `json:"id" db:"id"`
    IncidentID uuid.UUID `json:"incident_id" db:"incident_id"`
    UserID     uuid.UUID `json:"user_id" db:"user_id"`
    Timestamp  time.Time `json:"timestamp" db:"timestamp"`
    Text       string    `json:"text" db:"text"`
}

type Postmortem struct {
    IncidentID      uuid.UUID `json:"incident_id" db:"incident_id"`
    AuthorUserID    *uuid.UUID `json:"author_user_id" db:"author_user_id"`
    ContentMarkdown string    `json:"content_markdown" db:"content_markdown"`
    MetricsSnapshot string    `json:"metrics_snapshot" db:"metrics_snapshot"` // JSON string
    CreatedAt       time.Time `json:"created_at" db:"created_at"`
}