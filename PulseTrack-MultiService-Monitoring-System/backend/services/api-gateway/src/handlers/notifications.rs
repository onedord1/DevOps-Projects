use axum::{extract::{Extension, Path, Query, State}, Json};
use models::{
    AcknowledgeNotificationRequest, Claims, CreateNotificationChannelRequest, Notification,
    NotificationChannel, PaginationParams, PaginatedResponse,
};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use super::ApiResult;

pub async fn list_channels(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<NotificationChannel>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let channels = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "SELECT id, org_id, name, channel_type, config, is_active, created_at, updated_at FROM notification_channels WHERE org_id = $1 AND is_active = true ORDER BY created_at DESC"
    )
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(channels)))
}

pub async fn create_channel(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateNotificationChannelRequest>,
) -> ApiResult<NotificationChannel> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    create_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let id = Uuid::new_v4();
    let config_json = serde_json::to_value(&create_req.config)?;

    let channel = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "INSERT INTO notification_channels (id, org_id, name, channel_type, config) VALUES ($1, $2, $3, $4, $5) RETURNING id, org_id, name, channel_type, config, is_active, created_at, updated_at"
    )
    .bind(id)
    .bind(org_id)
    .bind(&create_req.name)
    .bind(&create_req.channel_type)
    .bind(config_json)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(channel)))
}

pub async fn delete_channel(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    sqlx::query(
        "DELETE FROM notification_channels WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .execute(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(())))
}

pub async fn list_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(pagination): Query<PaginationParams>,
) -> ApiResult<PaginatedResponse<Notification>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let offset = (pagination.page - 1) * pagination.per_page;

    let notifications = sqlx::query_as::<sqlx::Postgres, Notification>(
        "SELECT id, org_id, endpoint_id, channel_id, notification_type, status, subject, message, error_message, sent_at, acknowledged_at, created_at FROM notifications WHERE org_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(org_id)
    .bind(pagination.per_page as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM notifications WHERE org_id = $1"
    )
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    let total_pages = (total as f64 / pagination.per_page as f64).ceil() as u32;

    Ok(Json(models::ApiResponse::success(PaginatedResponse {
        items: notifications,
        total_items: total,
        page: pagination.page,
        per_page: pagination.per_page,
        total_pages,
    })))
}

pub async fn acknowledge_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(ack_req): Json<AcknowledgeNotificationRequest>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    sqlx::query(
        "UPDATE notifications SET status = 'acknowledged', acknowledged_at = NOW() WHERE id = ANY($1) AND org_id = $2"
    )
    .bind(&ack_req.notification_ids)
    .bind(org_id)
    .execute(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(())))
}
