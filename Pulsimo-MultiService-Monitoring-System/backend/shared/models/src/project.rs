use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

/// Project priority levels
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text")]
#[serde(rename_all = "lowercase")]
pub enum ProjectPriority {
    Low,
    Medium,
    High,
    Critical,
}

impl std::fmt::Display for ProjectPriority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProjectPriority::Low => write!(f, "low"),
            ProjectPriority::Medium => write!(f, "medium"),
            ProjectPriority::High => write!(f, "high"),
            ProjectPriority::Critical => write!(f, "critical"),
        }
    }
}

/// Project status
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "text")]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    Active,
    Archived,
    OnHold,
}

impl std::fmt::Display for ProjectStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProjectStatus::Active => write!(f, "active"),
            ProjectStatus::Archived => write!(f, "archived"),
            ProjectStatus::OnHold => write!(f, "on_hold"),
        }
    }
}

/// Project model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub color: String,
    pub priority: String,
    pub status: String,
    pub tags: Option<Vec<String>>,
    pub owner_email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}

/// Create project request
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateProjectRequest {
    #[validate(length(min = 1, max = 255, message = "Name must be between 1 and 255 characters"))]
    pub name: String,
    
    #[validate(length(min = 1, max = 255, message = "Slug must be between 1 and 255 characters"))]
    pub slug: String,
    
    pub description: Option<String>,
    
    pub color: Option<String>,
    
    pub priority: Option<ProjectPriority>,
    pub tags: Option<Vec<String>>,
    
    #[validate(email(message = "Invalid email address"))]
    pub owner_email: Option<String>,
}

/// Update project request
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct UpdateProjectRequest {
    #[validate(length(min = 1, max = 255, message = "Name must be between 1 and 255 characters"))]
    pub name: Option<String>,
    
    pub description: Option<String>,
    
    pub color: Option<String>,
    
    pub priority: Option<ProjectPriority>,
    pub status: Option<ProjectStatus>,
    pub tags: Option<Vec<String>>,
    
    #[validate(email(message = "Invalid email address"))]
    pub owner_email: Option<String>,
    
    pub is_active: Option<bool>,
}

/// Project with statistics
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectWithStats {
    pub id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub color: String,
    pub priority: String,
    pub status: String,
    pub tags: Option<Vec<String>>,
    pub owner_email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    
    // Statistics
    pub total_endpoints: Option<i64>,
    pub healthy_endpoints: Option<i64>,
    pub down_endpoints: Option<i64>,
    pub degraded_endpoints: Option<i64>,
    pub unknown_endpoints: Option<i64>,
    pub last_check_at: Option<DateTime<Utc>>,
}

/// Project statistics
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectStats {
    pub project_id: Uuid,
    pub org_id: Uuid,
    pub project_name: String,
    pub total_endpoints: Option<i64>,
    pub healthy_endpoints: Option<i64>,
    pub down_endpoints: Option<i64>,
    pub degraded_endpoints: Option<i64>,
    pub unknown_endpoints: Option<i64>,
    pub last_check_at: Option<DateTime<Utc>>,
}

impl ProjectStats {
    /// Calculate uptime percentage
    pub fn uptime_percentage(&self) -> f64 {
        let total = self.total_endpoints.unwrap_or(0);
        if total == 0 {
            return 100.0;
        }
        let healthy = self.healthy_endpoints.unwrap_or(0);
        (healthy as f64 / total as f64) * 100.0
    }

    /// Check if project is healthy
    pub fn is_healthy(&self) -> bool {
        let down = self.down_endpoints.unwrap_or(0);
        down == 0
    }
}
