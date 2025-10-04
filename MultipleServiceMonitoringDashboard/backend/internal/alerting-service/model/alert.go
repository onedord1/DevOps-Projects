package model

import (
    "time"

    "github.com/google/uuid"
)

type AlertRule struct {
    ID                    uuid.UUID  `json:"id" db:"id"`
    MonitorID             uuid.UUID  `json:"monitor_id" db:"monitor_id"`
    Name                  string     `json:"name" db:"name"`
    Environment           string     `json:"environment" db:"environment"`
    LatencyThresholdMs    *float64   `json:"latency_threshold_ms" db:"latency_threshold_ms"`
    ErrorRateThreshold    *float64   `json:"error_rate_threshold" db:"error_rate_threshold"`
    EvaluationWindowSecs  int        `json:"evaluation_window_seconds" db:"evaluation_window_seconds"`
    Severity              string     `json:"severity" db:"severity"`
    CooldownSecs          int        `json:"cooldown_seconds" db:"cooldown_seconds"`
    Enabled               bool       `json:"enabled" db:"enabled"`
    CreatedAt             time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

type AlertInstance struct {
    ID              uuid.UUID  `json:"id" db:"id"`
    RuleID          uuid.UUID  `json:"rule_id" db:"rule_id"`
    MonitorID       uuid.UUID  `json:"monitor_id" db:"monitor_id"`
    TriggeredAt     time.Time  `json:"triggered_at" db:"triggered_at"`
    ResolvedAt      *time.Time `json:"resolved_at" db:"resolved_at"`
    Status          string     `json:"status" db:"status"` // "active", "resolved"
    CurrentValue    *float64   `json:"current_value" db:"current_value"`
    Severity        string     `json:"severity" db:"severity"`
    NotificationSent bool       `json:"notification_sent" db:"notification_sent"`
    EscalationStage int        `json:"escalation_stage" db:"escalation_stage"`
    CreatedAt       time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}