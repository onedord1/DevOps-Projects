use axum::{extract::{Extension, Path, State}, Json};
use models::{Claims, ApiKey, ApiKeyResponse, CreateApiKeyRequest};
use uuid::Uuid;
use validator::Validate;
use sha2::{Sha256, Digest};

use crate::state::AppState;
use super::ApiResult;

pub async fn list_api_keys(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<ApiKeyResponse>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let keys = sqlx::query_as::<sqlx::Postgres, ApiKey>(
        "SELECT * FROM api_keys WHERE org_id = $1 AND is_active = true ORDER BY created_at DESC"
    )
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    let responses: Vec<ApiKeyResponse> = keys.into_iter().map(|k| k.into()).collect();
    Ok(Json(models::ApiResponse::success(responses)))
}

pub async fn create_api_key(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateApiKeyRequest>,
) -> ApiResult<ApiKeyResponse> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    create_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Generate API key
    let key = format!(
        "ptk_{}{}",
        Uuid::new_v4().simple(),
        Uuid::new_v4().simple()
    );
    
    let key_prefix = key.chars().take(12).collect::<String>();
    
    // Hash the key for storage
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    let key_hash = format!("{:x}", hasher.finalize());

    let api_key = sqlx::query_as::<sqlx::Postgres, ApiKey>(
        "INSERT INTO api_keys (org_id, name, key_hash, key_prefix, is_active) 
         VALUES ($1, $2, $3, $4, true) 
         RETURNING *"
    )
    .bind(org_id)
    .bind(&create_req.name)
    .bind(&key_hash)
    .bind(&key_prefix)
    .fetch_one(&state.db)
    .await?;

    let mut response: ApiKeyResponse = api_key.into();
    response.key = Some(key); // Only returned once during creation
    
    Ok(Json(models::ApiResponse::success(response)))
}

pub async fn delete_api_key(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let result = sqlx::query(
        "DELETE FROM api_keys WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(anyhow::anyhow!("API key not found or unauthorized").into());
    }

    Ok(Json(models::ApiResponse::success(())))
}
