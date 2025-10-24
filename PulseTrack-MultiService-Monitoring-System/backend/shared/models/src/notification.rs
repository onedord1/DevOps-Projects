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
    MsTeams,
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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Validate, Deserialize)]
pub struct CreateNotificationChannelRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
    pub channel_type: NotificationChannelType,
    pub config: NotificationChannelConfig,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum NotificationChannelConfig {
    Email {
        #[serde(rename = "to_addresses")]
        to_addresses: Vec<String>,
    },
    Slack {
        webhook_url: String,
        channel: Option<String>,
    },
    Discord {
        webhook_url: String,
    },
    MsTeams {
        webhook_url: String,
    },
    Webhook {
        url: String,
        headers: Option<serde_json::Value>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationType {
    EndpointDown,
    EndpointRecovered,
    EndpointPartialOutage,
    OrgMajorOutage,
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
