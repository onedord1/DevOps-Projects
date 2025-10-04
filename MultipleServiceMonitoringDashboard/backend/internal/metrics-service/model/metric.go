package model

import (
    "time"

    "github.com/google/uuid"
)

// Metric represents a single time-series data point
type Metric struct {
    Time        time.Time `json:"time" db:"time"`
    MonitorID   uuid.UUID `json:"monitor_id" db:"monitor_id"`
    Environment string    `json:"environment" db:"environment"`
    LatencyMs   *float64  `json:"latency_ms" db:"latency_ms"`
    Success     int       `json:"success" db:"success"` // 1 for true, 0 for false
    StatusCode  *int      `json:"status_code" db:"status_code"`
    ErrorCount  int       `json:"error_count" db:"error_count"`
}

// MetricAggregate represents aggregated data over a time window
type MetricAggregate struct {
    MonitorID     uuid.UUID `json:"monitor_id" db:"monitor_id"`
    IntervalStart time.Time `json:"interval_start" db:"interval_start"`
    IntervalMins  int       `json:"interval_minutes" db:"interval_minutes"`
    P50           *float64  `json:"p50" db:"p50"`
    P95           *float64  `json:"p95" db:"p95"`
    P99           *float64  `json:"p99" db:"p99"`
    ErrorRate     *float64  `json:"error_rate" db:"error_rate"`
    TotalCount    int64     `json:"total_count" db:"total_count"`
}