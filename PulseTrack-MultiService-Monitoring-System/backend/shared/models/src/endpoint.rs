use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "service_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ServiceType {
    Frontend,
    Backend,
    Microservice,
    Database,
    Api,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "endpoint_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EndpointStatus {
    Up,
    PartialOutage,
    Down,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Endpoint {
    pub id: Uuid,
    pub org_id: Uuid,
    pub project_id: Option<Uuid>,
    pub name: String,
    pub url: String,
    pub service_type: ServiceType,
    pub description: Option<String>,
    pub tags: Option<serde_json::Value>, // JSON array of strings
    pub owner_contact: Option<String>,
    pub check_interval_seconds: i32,
    pub timeout_seconds: i32,
    pub expected_status_code: Option<i32>,
    pub expected_response_time_ms: Option<i32>,
    pub failure_threshold_minutes: i32,
    pub retry_count: i32,
    pub retry_delay_seconds: i32,
    pub status: EndpointStatus,
    pub last_check_at: Option<DateTime<Utc>>,
    pub last_status_change_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub auth_header: Option<String>,
}

#[derive(Debug, Validate, Deserialize)]
pub struct CreateEndpointRequest {
    pub project_id: Option<Uuid>,
    #[validate(length(min = 2, max = 200))]
    pub name: String,
    #[validate(url)]
    pub url: String,
    pub service_type: ServiceType,
    #[validate(length(max = 500))]
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    #[validate(email)]
    pub owner_contact: Option<String>,
    #[validate(range(min = 10, max = 3600))]
    pub check_interval_seconds: Option<i32>,
    #[validate(range(min = 1, max = 120))]
    pub timeout_seconds: Option<i32>,
    pub expected_status_code: Option<i32>,
    pub expected_response_time_ms: Option<i32>,
    #[validate(range(min = 1, max = 10))]
    pub failure_threshold_minutes: Option<i32>,
    #[validate(range(min = 0, max = 5))]
    pub retry_count: Option<i32>,
    #[validate(length(max = 500))]
    pub auth_header: Option<String>,
}

#[derive(Debug, Validate, Deserialize)]
pub struct UpdateEndpointRequest {
    pub project_id: Option<Uuid>,
    #[validate(length(min = 2, max = 200))]
    pub name: Option<String>,
    #[validate(url)]
    pub url: Option<String>,
    pub service_type: Option<ServiceType>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub owner_contact: Option<String>,
    #[validate(range(min = 10, max = 3600))]
    pub check_interval_seconds: Option<i32>,
    #[validate(range(min = 1, max = 120))]
    pub timeout_seconds: Option<i32>,
    pub expected_status_code: Option<i32>,
    pub expected_response_time_ms: Option<i32>,
    #[validate(range(min = 1, max = 10))]
    pub failure_threshold_minutes: Option<i32>,
    pub is_active: Option<bool>,
    #[validate(length(max = 500))]
    pub auth_header: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct EndpointWithHealth {
    #[serde(flatten)]
    pub endpoint: Endpoint,
    pub current_downtime_seconds: Option<i64>,
    pub uptime_percentage_30d: Option<f64>,
    pub avg_response_time_ms: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct EndpointFilter {
    pub project_id: Option<Uuid>,
    pub status: Option<EndpointStatus>,
    pub service_type: Option<ServiceType>,
    pub tags: Option<Vec<String>>,
    pub is_active: Option<bool>,
}
