use axum::{extract::{Extension, Path, State}, Json};
use models::{Claims, Organization, UpdateOrganizationRequest};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use super::ApiResult;

pub async fn list_organizations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<Organization>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let orgs = sqlx::query_as::<sqlx::Postgres, Organization>(
        "SELECT * FROM organizations WHERE id = $1"
    )
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(orgs)))
}

pub async fn get_organization(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Organization> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    if id != org_id {
        return Err(anyhow::anyhow!("Unauthorized").into());
    }

    let org = sqlx::query_as::<sqlx::Postgres, Organization>(
        "SELECT * FROM organizations WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Organization not found"))?;

    Ok(Json(models::ApiResponse::success(org)))
}

pub async fn update_organization(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(update_req): Json<UpdateOrganizationRequest>,
) -> ApiResult<Organization> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    if id != org_id {
        return Err(anyhow::anyhow!("Unauthorized").into());
    }

    update_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let org = sqlx::query_as::<sqlx::Postgres, Organization>(
        "UPDATE organizations SET 
            name = COALESCE($1, name), 
            contact_email = COALESCE($2, contact_email), 
            is_active = COALESCE($3, is_active),
            timezone = COALESCE($4, timezone),
            date_format = COALESCE($5, date_format),
            updated_at = NOW()
        WHERE id = $6 RETURNING *"
    )
    .bind(&update_req.name)
    .bind(&update_req.contact_email)
    .bind(update_req.is_active)
    .bind(&update_req.timezone)
    .bind(&update_req.date_format)
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(org)))
}
