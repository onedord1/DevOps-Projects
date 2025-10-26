use axum::{extract::{Extension, Path, State}, Json};
use models::{Claims, CreateUserRequest, UpdateUserRequest, UserResponse, User};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use super::ApiResult;

pub async fn list_users(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<UserResponse>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let users = sqlx::query_as::<sqlx::Postgres, User>(
        "SELECT id, org_id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at FROM users WHERE org_id = $1 ORDER BY created_at DESC"
    )
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    let responses: Vec<UserResponse> = users.into_iter().map(|u| u.into()).collect();
    Ok(Json(models::ApiResponse::success(responses)))
}

pub async fn create_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateUserRequest>,
) -> ApiResult<UserResponse> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Only admins can create users
    if claims.role != models::UserRole::Admin {
        return Err(anyhow::anyhow!("Unauthorized").into());
    }

    create_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let password_hash = utils::hash_password(&create_req.password)?;
    let id = Uuid::new_v4();

    let user = sqlx::query_as::<sqlx::Postgres, User>(
        "INSERT INTO users (id, org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, org_id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at"
    )
    .bind(id)
    .bind(org_id)
    .bind(&create_req.email)
    .bind(&password_hash)
    .bind(&create_req.name)
    .bind(&create_req.role)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(user.into())))
}

pub async fn update_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(update_req): Json<UpdateUserRequest>,
) -> ApiResult<UserResponse> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Only admins can update users
    if claims.role != models::UserRole::Admin {
        return Err(anyhow::anyhow!("Unauthorized").into());
    }

    update_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let user = sqlx::query_as::<sqlx::Postgres, User>(
        "UPDATE users SET email = COALESCE($1, email), name = COALESCE($2, name), role = COALESCE($3, role), is_active = COALESCE($4, is_active) WHERE id = $5 AND org_id = $6 RETURNING id, org_id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at"
    )
    .bind(&update_req.email)
    .bind(&update_req.name)
    .bind(&update_req.role)
    .bind(update_req.is_active)
    .bind(id)
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(user.into())))
}

pub async fn delete_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Only admins can delete users
    if claims.role != models::UserRole::Admin {
        return Err(anyhow::anyhow!("Unauthorized").into());
    }

    sqlx::query(
        "DELETE FROM users WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .execute(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(())))
}
