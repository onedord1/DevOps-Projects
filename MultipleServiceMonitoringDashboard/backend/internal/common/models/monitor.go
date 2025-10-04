package models

import (
    "time"

    "github.com/google/uuid"
)

type Monitor struct {
    ID              uuid.UUID  `json:"id" db:"id"`
    Name            string     `json:"name" db:"name"`
    Description     string     `json:"description" db:"description"`
    Environment     string     `json:"environment" db:"environment"`
    Protocol        string     `json:"protocol" db:"protocol"` // HTTP, HTTPS, TCP, DNS, ICMP
    TargetHost      string     `json:"target_host" db:"target_host"`
    TargetPort      *int       `json:"target_port" db:"target_port"`
    Path            *string    `json:"path" db:"path"`
    IntervalSeconds int        `json:"interval_seconds" db:"interval_seconds"`
    TimeoutMs       int        `json:"timeout_ms" db:"timeout_ms"`
    Retries         int        `json:"retries" db:"retries"`
    ValidationRules string     `json:"validation_rules" db:"validation_rules"` // JSON string
    Enabled         bool       `json:"enabled" db:"enabled"`
    Tags            []string   `json:"tags" db:"tags"`
    CreatedAt       time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

type ProbeResult struct {
    ID           uuid.UUID  `json:"id" db:"id"`
    MonitorID    uuid.UUID  `json:"monitor_id" db:"monitor_id"`
    Timestamp    time.Time  `json:"timestamp" db:"timestamp"`
    LatencyMs    *float64   `json:"latency_ms" db:"latency_ms"`
    Success      bool       `json:"success" db:"success"`
    StatusCode   *int       `json:"status_code" db:"status_code"`
    ErrorMessage *string    `json:"error_message" db:"error_message"`
}