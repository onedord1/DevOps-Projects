use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApiKey {
    pub id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub key_hash: String,
    pub key_prefix: String,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct ApiKeyResponse {
    pub id: Uuid,
    pub org_id: Uuid,
    pub name: String,
    pub key_prefix: String,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>, // Only sent once during creation
}

#[derive(Debug, Validate, Deserialize)]
pub struct CreateApiKeyRequest {
    #[validate(length(min = 2, max = 100))]
    pub name: String,
}

impl From<ApiKey> for ApiKeyResponse {
    fn from(api_key: ApiKey) -> Self {
        ApiKeyResponse {
            id: api_key.id,
            org_id: api_key.org_id,
            name: api_key.name,
            key_prefix: api_key.key_prefix,
            created_at: api_key.created_at,
            last_used_at: api_key.last_used_at,
            is_active: api_key.is_active,
            key: None,
        }
    }
}
