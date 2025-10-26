use axum::{extract::State, Json};
use models::{
    LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse,
    RegisterOrganizationRequest, RegisterOrganizationResponse, UserInfo,
};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use super::ApiResult;

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterOrganizationRequest>,
) -> ApiResult<RegisterOrganizationResponse> {
    req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Check if organization slug already exists
    let existing_org: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM organizations WHERE slug = $1"
    )
    .bind(&req.org_slug)
    .fetch_optional(&state.db)
    .await?;

    if existing_org.is_some() {
        return Err(anyhow::anyhow!("Organization slug already exists").into());
    }

    // Start transaction
    let mut tx = state.db.begin().await?;

    // Create organization
    let org_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO organizations (id, name, slug, contact_email) VALUES ($1, $2, $3, $4)"
    )
    .bind(org_id)
    .bind(&req.org_name)
    .bind(&req.org_slug)
    .bind(&req.org_contact_email)
    .execute(&mut *tx)
    .await?;

    // Hash password
    let password_hash = utils::hash_password(&req.admin_password)?;

    // Create admin user
    let user_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO users (id, org_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, 'admin')"
    )
    .bind(user_id)
    .bind(org_id)
    .bind(&req.admin_email)
    .bind(&password_hash)
    .bind(&req.admin_name)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // Generate tokens
    let access_token = state
        .jwt_service
        .generate_access_token(user_id, org_id, &req.admin_email, models::UserRole::Admin)?;
    let refresh_token = state
        .jwt_service
        .generate_refresh_token(user_id, org_id, &req.admin_email, models::UserRole::Admin)?;

    Ok(Json(models::ApiResponse::success(
        RegisterOrganizationResponse {
            org_id,
            user_id,
            access_token,
            refresh_token,
        },
    )))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> ApiResult<LoginResponse> {
    req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Find user
    let user = sqlx::query_as::<sqlx::Postgres, models::User>(
        "SELECT id, org_id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at FROM users WHERE email = $1 AND is_active = true"
    )
    .bind(&req.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Invalid credentials"))?;

    // Verify password
    if !utils::verify_password(&req.password, &user.password_hash)? {
        return Err(anyhow::anyhow!("Invalid credentials").into());
    }

    // Update last login
    sqlx::query(
        "UPDATE users SET last_login_at = NOW() WHERE id = $1"
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    // Generate tokens
    let access_token = state
        .jwt_service
        .generate_access_token(user.id, user.org_id, &user.email, user.role.clone())?;
    let refresh_token = state
        .jwt_service
        .generate_refresh_token(user.id, user.org_id, &user.email, user.role.clone())?;

    Ok(Json(models::ApiResponse::success(LoginResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            org_id: user.org_id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    })))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshTokenRequest>,
) -> ApiResult<RefreshTokenResponse> {
    req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Verify refresh token
    let claims = state
        .jwt_service
        .verify_token(&req.refresh_token)
        .map_err(|_| anyhow::anyhow!("Invalid refresh token"))?;

    let user_id = Uuid::parse_str(&claims.sub)?;
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Generate new access token
    let access_token = state
        .jwt_service
        .generate_access_token(user_id, org_id, &claims.email, claims.role)?;

    Ok(Json(models::ApiResponse::success(
        RefreshTokenResponse { access_token },
    )))
}
