use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "check_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CheckStatus {
    Success,
    Failure,
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "failure_reason", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FailureReason {
    Timeout,
    DnsError,
    ConnectionError,
    TlsError,
    HttpError,
    UnexpectedStatusCode,
    ResponseTimeExceeded,
    InvalidResponse,
    NetworkError,
    Other,
}

impl std::fmt::Display for FailureReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FailureReason::Timeout => write!(f, "TIMEOUT"),
            FailureReason::DnsError => write!(f, "DNS_ERROR"),
            FailureReason::ConnectionError => write!(f, "CONNECTION_ERROR"),
            FailureReason::TlsError => write!(f, "TLS_ERROR"),
            FailureReason::HttpError => write!(f, "HTTP_ERROR"),
            FailureReason::UnexpectedStatusCode => write!(f, "UNEXPECTED_STATUS_CODE"),
            FailureReason::ResponseTimeExceeded => write!(f, "RESPONSE_TIME_EXCEEDED"),
            FailureReason::InvalidResponse => write!(f, "INVALID_RESPONSE"),
            FailureReason::NetworkError => write!(f, "NETWORK_ERROR"),
            FailureReason::Other => write!(f, "OTHER"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthCheck {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub check_status: CheckStatus,
    pub response_time_ms: Option<i32>,
    pub status_code: Option<i32>,
    pub failure_reason: Option<FailureReason>,
    pub error_message: Option<String>,
    pub checked_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub endpoint_id: Uuid,
    pub success: bool,
    pub response_time_ms: Option<i32>,
    pub status_code: Option<i32>,
    pub failure_reason: Option<FailureReason>,
    pub error_message: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCheckHistory {
    pub endpoint_id: Uuid,
    pub endpoint_name: String,
    pub checks: Vec<HealthCheck>,
    pub total_checks: i64,
    pub successful_checks: i64,
    pub failed_checks: i64,
    pub avg_response_time_ms: Option<f64>,
    pub uptime_percentage: f64,
}

#[derive(Debug, Deserialize)]
pub struct HealthCheckQuery {
    pub endpoint_id: Option<Uuid>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<CheckStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UptimeStats {
    pub endpoint_id: Uuid,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub total_uptime_seconds: i64,
    pub total_downtime_seconds: i64,
    pub uptime_percentage: f64,
    pub incident_count: i64,
    pub avg_response_time_ms: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatusTimeline {
    pub timestamp: DateTime<Utc>,
    pub status: CheckStatus,
    pub response_time_ms: Option<i32>,
    pub failure_reason: Option<FailureReason>,
}
