use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{EndpointStatus, FailureReason, NotificationType};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Event {
    EndpointStatusChanged {
        endpoint_id: Uuid,
        org_id: Uuid,
        endpoint_name: String,
        old_status: EndpointStatus,
        new_status: EndpointStatus,
        timestamp: DateTime<Utc>,
    },
    EndpointCheckCompleted {
        endpoint_id: Uuid,
        org_id: Uuid,
        success: bool,
        response_time_ms: Option<i32>,
        status_code: Option<i32>,
        failure_reason: Option<FailureReason>,
        timestamp: DateTime<Utc>,
    },
    EndpointDownThresholdReached {
        endpoint_id: Uuid,
        org_id: Uuid,
        endpoint_name: String,
        endpoint_url: String,
        downtime_seconds: i64,
        failure_reason: Option<FailureReason>,
        error_message: Option<String>,
        timestamp: DateTime<Utc>,
    },
    EndpointRecovered {
        endpoint_id: Uuid,
        org_id: Uuid,
        endpoint_name: String,
        endpoint_url: String,
        downtime_duration_seconds: i64,
        timestamp: DateTime<Utc>,
    },
    OrgMajorOutage {
        org_id: Uuid,
        org_name: String,
        down_endpoints_count: i64,
        total_endpoints_count: i64,
        timestamp: DateTime<Utc>,
    },
    NotificationSent {
        notification_id: Uuid,
        org_id: Uuid,
        notification_type: NotificationType,
        channel_name: String,
        success: bool,
        timestamp: DateTime<Utc>,
    },
    Custom {
        event_type: String,
        data: serde_json::Value,
        timestamp: DateTime<Utc>,
    },
}

impl Event {
    pub fn event_type(&self) -> &str {
        match self {
            Event::EndpointStatusChanged { .. } => "endpoint_status_changed",
            Event::EndpointCheckCompleted { .. } => "endpoint_check_completed",
            Event::EndpointDownThresholdReached { .. } => "endpoint_down_threshold_reached",
            Event::EndpointRecovered { .. } => "endpoint_recovered",
            Event::OrgMajorOutage { .. } => "org_major_outage",
            Event::NotificationSent { .. } => "notification_sent",
            Event::Custom { event_type, .. } => event_type,
        }
    }

    pub fn org_id(&self) -> Uuid {
        match self {
            Event::EndpointStatusChanged { org_id, .. } => *org_id,
            Event::EndpointCheckCompleted { org_id, .. } => *org_id,
            Event::EndpointDownThresholdReached { org_id, .. } => *org_id,
            Event::EndpointRecovered { org_id, .. } => *org_id,
            Event::OrgMajorOutage { org_id, .. } => *org_id,
            Event::NotificationSent { org_id, .. } => *org_id,
            Event::Custom { .. } => Uuid::nil(), // Custom events don't have org_id
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventMessage {
    pub id: String,
    pub event: Event,
    pub published_at: DateTime<Utc>,
}

impl EventMessage {
    pub fn new(event: Event) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            event,
            published_at: Utc::now(),
        }
    }
}
