use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub contact_email: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
    pub timezone: String,
    pub date_format: String,
}

#[derive(Debug, Validate, Deserialize)]
pub struct CreateOrganizationRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
    #[validate(length(min = 2, max = 50))]
    pub slug: String,
    #[validate(email)]
    pub contact_email: String,
}

#[derive(Debug, Validate, Deserialize)]
pub struct UpdateOrganizationRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: Option<String>,
    #[validate(email)]
    pub contact_email: Option<String>,
    pub is_active: Option<bool>,
    pub timezone: Option<String>,
    pub date_format: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OrganizationWithStats {
    #[serde(flatten)]
    pub organization: Organization,
    pub total_endpoints: i64,
    pub active_endpoints: i64,
    pub down_endpoints: i64,
}
