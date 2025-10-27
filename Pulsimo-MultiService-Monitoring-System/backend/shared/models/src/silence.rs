use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// Notification silence types
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum SilenceType {
    Temporary,
    Permanent,
}

/// Notification silence/suppression record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NotificationSilence {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub channel_id: Option<Uuid>, // None means all channels
    pub org_id: Uuid,
    pub created_by: Uuid,
    pub reason: Option<String>,
    pub silence_type: SilenceType,
    pub starts_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a new silence
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateSilenceRequest {
    pub endpoint_id: Uuid,
    
    /// If None, silence applies to all channels
    pub channel_id: Option<Uuid>,
    
    #[validate(length(max = 500, message = "Reason must not exceed 500 characters"))]
    pub reason: Option<String>,
    
    pub silence_type: SilenceType,
    
    /// For temporary silences, duration in minutes
    #[validate(range(min = 1, max = 43200, message = "Duration must be between 1 minute and 30 days"))]
    pub duration_minutes: Option<i32>,
}

/// Request to unmute/remove a silence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnmuteRequest {
    pub endpoint_id: Uuid,
    pub channel_id: Option<Uuid>,
}

/// Response with silence details including endpoint info
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SilenceWithDetails {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub endpoint_name: String,
    pub channel_id: Option<Uuid>,
    pub channel_name: Option<String>,
    pub org_id: Uuid,
    pub created_by: Uuid,
    pub created_by_name: String,
    pub reason: Option<String>,
    pub silence_type: SilenceType,
    pub starts_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Quick preset durations for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceDurationPreset {
    pub label: String,
    pub minutes: i32,
}

impl SilenceDurationPreset {
    pub fn presets() -> Vec<Self> {
        vec![
            Self { label: "1 hour".to_string(), minutes: 60 },
            Self { label: "4 hours".to_string(), minutes: 240 },
            Self { label: "12 hours".to_string(), minutes: 720 },
            Self { label: "24 hours".to_string(), minutes: 1440 },
            Self { label: "3 days".to_string(), minutes: 4320 },
            Self { label: "1 week".to_string(), minutes: 10080 },
        ]
    }
}

/// Check if an endpoint is currently silenced for a specific channel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceCheckRequest {
    pub endpoint_id: Uuid,
    pub channel_id: Uuid,
}

/// Response indicating if notifications are silenced
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceCheckResponse {
    pub is_silenced: bool,
    pub silence_id: Option<Uuid>,
    pub expires_at: Option<DateTime<Utc>>,
    pub reason: Option<String>,
}
