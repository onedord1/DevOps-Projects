use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "notification_channel_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum NotificationChannelType {
    Email,
    Slack,
    Discord,
    #[serde(rename = "msteams")]
    MsTeams,
    #[serde(rename = "googlechat")]
    GoogleChat,
    Webhook,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NotificationChannel {
    pub id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub channel_type: NotificationChannelType,
    pub config: serde_json::Value, // Channel-specific configuration
    pub is_active: bool,
    pub repeat_interval_minutes: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Validate, Deserialize)]
pub struct CreateNotificationChannelRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
    pub channel_type: NotificationChannelType,
    pub config: NotificationChannelConfig,
    #[validate(range(min = 1, max = 1440))]
    pub repeat_interval_minutes: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum NotificationChannelConfig {
    Email {
        #[serde(rename = "to_addresses")]
        to_addresses: Vec<String>,
        smtp_server: Option<String>,
        smtp_port: Option<u16>,
        from_email: Option<String>,
    },
    Slack {
        webhook_url: String,
        channel: Option<String>,
        username: Option<String>,
        icon_emoji: Option<String>,
    },
    Discord {
        webhook_url: String,
        username: Option<String>,
        avatar_url: Option<String>,
    },
    #[serde(rename = "msteams")]
    MsTeams {
        webhook_url: String,
    },
    #[serde(rename = "googlechat")]
    GoogleChat {
        webhook_url: String,
    },
    Webhook {
        url: String,
        headers: Option<serde_json::Value>,
        method: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationType {
    EndpointDown,
    EndpointRecovered,
    EndpointPartialOutage,
    OrgMajorOutage,
    IncidentCreated,
    IncidentAcknowledged,
    IncidentResolved,
    IncidentEscalated,
    SslCertificateExpiring,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_status", rename_all = "lowercase")]
pub enum NotificationStatus {
    Pending,
    Sent,
    Failed,
    Acknowledged,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub org_id: Uuid,
    pub endpoint_id: Option<Uuid>,
    pub channel_id: Uuid,
    pub notification_type: NotificationType,
    pub status: NotificationStatus,
    pub subject: String,
    pub message: String,
    pub error_message: Option<String>,
    pub sent_at: Option<DateTime<Utc>>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationPayload {
    pub org_id: Uuid,
    pub endpoint_id: Option<Uuid>,
    pub endpoint_name: Option<String>,
    pub notification_type: NotificationType,
    pub subject: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AcknowledgeNotificationRequest {
    pub notification_ids: Vec<Uuid>,
}

// Notification routing rules
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NotificationRule {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub enabled: bool,
    pub severity_filter: Option<Vec<String>>, // ["critical", "high"]
    pub notification_types: Option<Vec<String>>, // Which events to notify
    pub time_window_start: Option<String>, // "09:00"
    pub time_window_end: Option<String>, // "17:00"
    pub days_of_week: Option<Vec<i32>>, // [1,2,3,4,5] = Mon-Fri
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNotificationRuleRequest {
    pub channel_id: Uuid,
    pub name: String,
    pub severity_filter: Option<Vec<String>>,
    pub notification_types: Option<Vec<String>>,
    pub time_window_start: Option<String>,
    pub time_window_end: Option<String>,
    pub days_of_week: Option<Vec<i32>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNotificationRuleRequest {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub severity_filter: Option<Vec<String>>,
    pub notification_types: Option<Vec<String>>,
    pub time_window_start: Option<String>,
    pub time_window_end: Option<String>,
    pub days_of_week: Option<Vec<i32>>,
}

// Test notification request
#[derive(Debug, Serialize, Deserialize)]
pub struct TestNotificationRequest {
    pub channel_id: Uuid,
    pub test_message: Option<String>,
}
