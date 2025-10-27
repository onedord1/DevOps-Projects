use axum::{extract::{Extension, Path, Query, State}, Json};
use models::{
    AcknowledgeNotificationRequest, Claims, CreateNotificationChannelRequest, Notification,
    NotificationChannel, PaginationParams, PaginatedResponse, TestNotificationRequest,
    NotificationType, CreateSilenceRequest, UnmuteRequest, NotificationSilence,
    SilenceWithDetails, SilenceCheckRequest, SilenceCheckResponse, SilenceType,
    SilenceDurationPreset,
};
use uuid::Uuid;
use validator::Validate;
use chrono::Utc;

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
        "SELECT id, org_id, name, channel_type, config, is_active, repeat_interval_minutes, created_at, updated_at FROM notification_channels WHERE id = $1 AND org_id = $2"
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

// ============================================================================
// Notification Silence/Mute Handlers
// ============================================================================

/// Create a new silence for an endpoint
pub async fn create_silence(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateSilenceRequest>,
) -> ApiResult<NotificationSilence> {
    let org_id = Uuid::parse_str(&claims.org_id)?;
    let user_id = Uuid::parse_str(&claims.sub)?;

    create_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Verify endpoint belongs to org
    let endpoint_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM endpoints WHERE id = $1 AND org_id = $2)"
    )
    .bind(create_req.endpoint_id)
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    if !endpoint_exists {
        return Err(anyhow::anyhow!("Endpoint not found or access denied").into());
    }

    // If channel_id is provided, verify it belongs to org
    if let Some(channel_id) = create_req.channel_id {
        let channel_exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM notification_channels WHERE id = $1 AND org_id = $2)"
        )
        .bind(channel_id)
        .bind(org_id)
        .fetch_one(&state.db)
        .await?;

        if !channel_exists {
            return Err(anyhow::anyhow!("Notification channel not found or access denied").into());
        }
    }

    // Deactivate any existing active silences for this endpoint+channel combination
    sqlx::query(
        "UPDATE notification_silences 
         SET is_active = false, updated_at = NOW()
         WHERE endpoint_id = $1 
         AND (channel_id = $2 OR ($2 IS NULL AND channel_id IS NULL))
         AND is_active = true"
    )
    .bind(create_req.endpoint_id)
    .bind(create_req.channel_id)
    .execute(&state.db)
    .await?;

    // Calculate expires_at for temporary silences
    let expires_at = if create_req.silence_type == SilenceType::Temporary {
        let duration_minutes = create_req.duration_minutes
            .ok_or_else(|| anyhow::anyhow!("duration_minutes is required for temporary silences"))?;
        Some(Utc::now() + chrono::Duration::minutes(duration_minutes as i64))
    } else {
        None
    };

    let id = Uuid::new_v4();
    
    // Create new silence
    let silence = sqlx::query_as::<sqlx::Postgres, NotificationSilence>(
        "INSERT INTO notification_silences 
         (id, endpoint_id, channel_id, org_id, created_by, reason, silence_type, starts_at, expires_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, true)
         RETURNING id, endpoint_id, channel_id, org_id, created_by, reason, silence_type, starts_at, expires_at, is_active, created_at, updated_at"
    )
    .bind(id)
    .bind(create_req.endpoint_id)
    .bind(create_req.channel_id)
    .bind(org_id)
    .bind(user_id)
    .bind(&create_req.reason)
    .bind(&create_req.silence_type)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await?;

    tracing::info!(
        "Created notification silence: endpoint={}, channel={:?}, type={:?}, user={}",
        create_req.endpoint_id,
        create_req.channel_id,
        create_req.silence_type,
        user_id
    );

    Ok(Json(models::ApiResponse::success(silence)))
}

/// Remove/unmute a silence
pub async fn unmute_endpoint(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(unmute_req): Json<UnmuteRequest>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Deactivate matching silences
    let result = sqlx::query(
        "UPDATE notification_silences 
         SET is_active = false, updated_at = NOW()
         WHERE endpoint_id = $1 
         AND org_id = $2
         AND (channel_id = $3 OR ($3 IS NULL AND channel_id IS NULL))
         AND is_active = true"
    )
    .bind(unmute_req.endpoint_id)
    .bind(org_id)
    .bind(unmute_req.channel_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(anyhow::anyhow!("No active silence found").into());
    }

    tracing::info!(
        "Unmuted endpoint: endpoint={}, channel={:?}",
        unmute_req.endpoint_id,
        unmute_req.channel_id
    );

    Ok(Json(models::ApiResponse::success(())))
}

/// List all active silences for an organization
pub async fn list_silences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> ApiResult<Vec<SilenceWithDetails>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Deactivate expired silences first
    sqlx::query("SELECT deactivate_expired_silences()")
        .execute(&state.db)
        .await?;

    let silences = sqlx::query_as::<sqlx::Postgres, SilenceWithDetails>(
        "SELECT 
            ns.id,
            ns.endpoint_id,
            e.name as endpoint_name,
            ns.channel_id,
            nc.name as channel_name,
            ns.org_id,
            ns.created_by,
            u.name as created_by_name,
            ns.reason,
            ns.silence_type,
            ns.starts_at,
            ns.expires_at,
            ns.is_active,
            ns.created_at,
            ns.updated_at
         FROM notification_silences ns
         JOIN endpoints e ON ns.endpoint_id = e.id
         JOIN users u ON ns.created_by = u.id
         LEFT JOIN notification_channels nc ON ns.channel_id = nc.id
         WHERE ns.org_id = $1 AND ns.is_active = true
         ORDER BY ns.created_at DESC"
    )
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(silences)))
}

/// Check if an endpoint is currently silenced for a specific channel
pub async fn check_silence(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(check_req): Query<SilenceCheckRequest>,
) -> ApiResult<SilenceCheckResponse> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Deactivate expired silences first
    sqlx::query("SELECT deactivate_expired_silences()")
        .execute(&state.db)
        .await?;

    // Check if endpoint is silenced for this specific channel or globally
    let silence: Option<(Uuid, Option<chrono::DateTime<Utc>>, Option<String>)> = sqlx::query_as(
        "SELECT id, expires_at, reason
         FROM notification_silences
         WHERE endpoint_id = $1
         AND org_id = $2
         AND (channel_id = $3 OR channel_id IS NULL)
         AND is_active = true
         ORDER BY channel_id NULLS LAST
         LIMIT 1"
    )
    .bind(check_req.endpoint_id)
    .bind(org_id)
    .bind(check_req.channel_id)
    .fetch_optional(&state.db)
    .await?;

    let response = if let Some((silence_id, expires_at, reason)) = silence {
        SilenceCheckResponse {
            is_silenced: true,
            silence_id: Some(silence_id),
            expires_at,
            reason,
        }
    } else {
        SilenceCheckResponse {
            is_silenced: false,
            silence_id: None,
            expires_at: None,
            reason: None,
        }
    };

    Ok(Json(models::ApiResponse::success(response)))
}

/// Get available silence duration presets
pub async fn get_silence_presets() -> ApiResult<Vec<SilenceDurationPreset>> {
    Ok(Json(models::ApiResponse::success(SilenceDurationPreset::presets())))
}

/// Get silence status for an endpoint (all channels)
pub async fn get_endpoint_silence_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
) -> ApiResult<Vec<SilenceWithDetails>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Deactivate expired silences first
    sqlx::query("SELECT deactivate_expired_silences()")
        .execute(&state.db)
        .await?;

    let silences = sqlx::query_as::<sqlx::Postgres, SilenceWithDetails>(
        "SELECT 
            ns.id,
            ns.endpoint_id,
            e.name as endpoint_name,
            ns.channel_id,
            nc.name as channel_name,
            ns.org_id,
            ns.created_by,
            u.name as created_by_name,
            ns.reason,
            ns.silence_type,
            ns.starts_at,
            ns.expires_at,
            ns.is_active,
            ns.created_at,
            ns.updated_at
         FROM notification_silences ns
         JOIN endpoints e ON ns.endpoint_id = e.id
         JOIN users u ON ns.created_by = u.id
         LEFT JOIN notification_channels nc ON ns.channel_id = nc.id
         WHERE ns.endpoint_id = $1 AND ns.org_id = $2 AND ns.is_active = true
         ORDER BY ns.created_at DESC"
    )
    .bind(endpoint_id)
    .bind(org_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(silences)))
}
