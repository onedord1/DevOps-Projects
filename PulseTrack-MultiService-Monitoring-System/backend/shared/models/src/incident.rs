use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::endpoint::ServiceType;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq, Eq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum IncidentSeverity {
    #[serde(rename = "critical")]
    Critical,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "low")]
    Low,
}

impl std::fmt::Display for IncidentSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            IncidentSeverity::Critical => write!(f, "critical"),
            IncidentSeverity::High => write!(f, "high"),
            IncidentSeverity::Medium => write!(f, "medium"),
            IncidentSeverity::Low => write!(f, "low"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq, Eq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum IncidentState {
    #[serde(rename = "open")]
    Open,
    #[serde(rename = "acknowledged")]
    Acknowledged,
    #[serde(rename = "investigating")]
    Investigating,
    #[serde(rename = "resolved")]
    Resolved,
    #[serde(rename = "closed")]
    Closed,
}

impl std::fmt::Display for IncidentState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            IncidentState::Open => write!(f, "open"),
            IncidentState::Acknowledged => write!(f, "acknowledged"),
            IncidentState::Investigating => write!(f, "investigating"),
            IncidentState::Resolved => write!(f, "resolved"),
            IncidentState::Closed => write!(f, "closed"),
        }
    }
}

impl IncidentState {
    pub fn can_transition_to(&self, target: &IncidentState) -> bool {
        match (self, target) {
            // From Open
            (IncidentState::Open, IncidentState::Acknowledged) => true,
            (IncidentState::Open, IncidentState::Investigating) => true,
            (IncidentState::Open, IncidentState::Closed) => true, // Can close false alarms
            
            // From Acknowledged
            (IncidentState::Acknowledged, IncidentState::Investigating) => true,
            (IncidentState::Acknowledged, IncidentState::Resolved) => true,
            (IncidentState::Acknowledged, IncidentState::Open) => true, // Can revert
            
            // From Investigating
            (IncidentState::Investigating, IncidentState::Resolved) => true,
            (IncidentState::Investigating, IncidentState::Acknowledged) => true, // Can go back
            
            // From Resolved
            (IncidentState::Resolved, IncidentState::Closed) => true,
            (IncidentState::Resolved, IncidentState::Open) => true, // Re-open if issue returns
            
            // From Closed
            (IncidentState::Closed, IncidentState::Open) => true, // Re-open if needed
            
            _ => false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Incident {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub severity: IncidentSeverity,
    pub state: IncidentState,
    pub assigned_to: Option<String>,
    
    pub created_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub investigating_started_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
    
    pub resolution_notes: Option<String>,
    
    pub first_failure_at: DateTime<Utc>,
    pub last_failure_at: DateTime<Utc>,
    pub failure_count: i32,
    
    pub metadata: serde_json::Value,
    pub created_by: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateIncidentRequest {
    pub endpoint_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub severity: IncidentSeverity,
    pub assigned_to: Option<String>,
    pub first_failure_at: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateIncidentRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub severity: Option<IncidentSeverity>,
    pub assigned_to: Option<String>,
    pub resolution_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeIncidentStateRequest {
    pub state: IncidentState,
    pub notes: Option<String>,
    pub changed_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IncidentStateHistory {
    pub id: Uuid,
    pub incident_id: Uuid,
    pub from_state: Option<String>,
    pub to_state: String,
    pub changed_by: Option<String>,
    pub notes: Option<String>,
    pub changed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IncidentWithEndpoint {
    // Incident fields
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub severity: IncidentSeverity,
    pub state: IncidentState,
    pub assigned_to: Option<String>,
    
    pub created_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub investigating_started_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
    
    pub resolution_notes: Option<String>,
    
    pub first_failure_at: DateTime<Utc>,
    pub last_failure_at: DateTime<Utc>,
    pub failure_count: i32,
    
    pub metadata: serde_json::Value,
    pub created_by: Option<String>,
    pub updated_at: DateTime<Utc>,
    
    // Endpoint fields
    pub endpoint_name: String,
    pub endpoint_url: String,
    pub endpoint_service_type: ServiceType,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct IncidentStats {
    pub total_incidents: i64,
    pub open_incidents: i64,
    pub acknowledged_incidents: i64,
    pub investigating_incidents: i64,
    pub resolved_today: i64,
    pub critical_incidents: i64,
    pub avg_resolution_time_minutes: Option<f64>,
}
