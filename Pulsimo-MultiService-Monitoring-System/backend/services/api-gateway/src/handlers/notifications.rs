use axum::{extract::{Extension, Path, Query, State}, Json};
use models::{
    AcknowledgeNotificationRequest, Claims, CreateNotificationChannelRequest, Notification,
    NotificationChannel, PaginationParams, PaginatedResponse, TestNotificationRequest,
    NotificationType,
};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use crate::services::NotificationService;
use super::ApiResult;

pub async fn list_channels(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<NotificationChannel>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let channels = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "SELECT id, org_id, name, channel_type, config, is_active, repeat_interval_minutes, created_at, updated_at FROM notification_channels WHERE org_id = $1 AND is_active = true ORDER BY created_at DESC"
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

    let repeat_interval = create_req.repeat_interval_minutes.unwrap_or(15);

    let channel = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "INSERT INTO notification_channels (id, org_id, name, channel_type, config, repeat_interval_minutes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, org_id, name, channel_type, config, is_active, repeat_interval_minutes, created_at, updated_at"
    )
    .bind(id)
    .bind(org_id)
    .bind(&create_req.name)
    .bind(&create_req.channel_type)
    .bind(config_json)
    .bind(repeat_interval)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(channel)))
}

pub async fn update_channel(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(update_req): Json<CreateNotificationChannelRequest>,
) -> ApiResult<NotificationChannel> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    update_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let config_json = serde_json::to_value(&update_req.config)?;
    let repeat_interval = update_req.repeat_interval_minutes.unwrap_or(15);

    let channel = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "UPDATE notification_channels 
         SET name = $1, channel_type = $2, config = $3, repeat_interval_minutes = $4, updated_at = NOW()
         WHERE id = $5 AND org_id = $6
         RETURNING id, org_id, name, channel_type, config, is_active, repeat_interval_minutes, created_at, updated_at"
    )
    .bind(&update_req.name)
    .bind(&update_req.channel_type)
    .bind(config_json)
    .bind(repeat_interval)
    .bind(id)
    .bind(org_id)
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

pub async fn test_notification(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(test_req): Json<TestNotificationRequest>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Fetch the channel
    let channel: NotificationChannel = sqlx::query_as::<sqlx::Postgres, NotificationChannel>(
        "SELECT id, org_id, name, channel_type, config, is_active, created_at, updated_at FROM notification_channels WHERE id = $1 AND org_id = $2"
    )
    .bind(test_req.channel_id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Channel not found"))?;

    // Parse the config
    let config: models::NotificationChannelConfig = serde_json::from_value(channel.config.clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse channel config: {}", e))?;

    // Send test notification
    let notification_service = NotificationService::new();
    let test_message = test_req.test_message.unwrap_or_else(|| "This is a test notification from your Service Monitoring System. If you received this, your notification channel is working correctly! 🎉".to_string());
    
    notification_service
        .send_notification(
            &channel.channel_type,
            &config,
            &NotificationType::OrgMajorOutage,
            "🧪 Test Notification",
            &test_message,
            None,
            Some("medium"),
            Some("https://example.com/test-endpoint"),
        )
        .await
        .map_err(|e| anyhow::anyhow!("Failed to send test notification: {}", e))?;

    Ok(Json(models::ApiResponse::success(())))
}
