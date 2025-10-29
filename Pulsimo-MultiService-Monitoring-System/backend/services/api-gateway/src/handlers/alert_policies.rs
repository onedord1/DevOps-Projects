use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use models::ApiResponse;

use super::AppError;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AlertPolicy {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub severity: String,
    pub enabled: bool,
    pub consecutive_failures_threshold: i32,
    pub send_warning_on_first_failure: bool,
    pub warning_channels: serde_json::Value,
    pub send_alert_on_threshold: bool,
    pub alert_channels: serde_json::Value,
    pub escalation_enabled: bool,
    pub escalation_delay_seconds: i32,
    pub escalation_channels: serde_json::Value,
    pub escalation_recipients: serde_json::Value,
    pub quiet_hours_enabled: bool,
    pub quiet_hours_schedule: serde_json::Value,
    pub throttle_enabled: bool,
    pub throttle_max_alerts: i32,
    pub throttle_time_window_seconds: i32,
    pub response_time_threshold_ms: Option<i32>,
    pub response_time_window: i32,
    pub warning_message_template: Option<String>,
    pub alert_message_template: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
    pub created_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAlertPolicyRequest {
    pub severity: String,
    pub enabled: Option<bool>,
    pub consecutive_failures_threshold: i32,
    pub send_warning_on_first_failure: Option<bool>,
    pub warning_channels: Option<serde_json::Value>,
    pub send_alert_on_threshold: Option<bool>,
    pub alert_channels: Option<serde_json::Value>,
    pub escalation_enabled: Option<bool>,
    pub escalation_delay_seconds: Option<i32>,
    pub escalation_channels: Option<serde_json::Value>,
    pub escalation_recipients: Option<serde_json::Value>,
    pub quiet_hours_enabled: Option<bool>,
    pub quiet_hours_schedule: Option<serde_json::Value>,
    pub throttle_enabled: Option<bool>,
    pub throttle_max_alerts: Option<i32>,
    pub throttle_time_window_seconds: Option<i32>,
    pub response_time_threshold_ms: Option<i32>,
    pub response_time_window: Option<i32>,
    pub warning_message_template: Option<String>,
    pub alert_message_template: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AlertPolicyPreset {
    pub id: i32,
    pub name: String,
    pub severity: String,
    pub description: Option<String>,
    pub config: serde_json::Value,
    pub is_system: bool,
    pub created_at: chrono::NaiveDateTime,
}

// Create or update alert policy for an endpoint
pub async fn create_or_update_alert_policy(
    State(state): State<AppState>,
    Path(endpoint_id): Path<Uuid>,
    Json(payload): Json<CreateAlertPolicyRequest>,
) -> Result<Json<ApiResponse<AlertPolicy>>, AppError> {
    // Verify endpoint exists and user has access
    let _endpoint: (Uuid,) = sqlx::query_as(
        "SELECT id FROM endpoints WHERE id = $1"
    )
    .bind(endpoint_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    // Upsert alert policy
    let policy: AlertPolicy = sqlx::query_as(
        r#"
        INSERT INTO alert_policies (
            endpoint_id,
            severity,
            enabled,
            consecutive_failures_threshold,
            send_warning_on_first_failure,
            warning_channels,
            send_alert_on_threshold,
            alert_channels,
            escalation_enabled,
            escalation_delay_seconds,
            escalation_channels,
            escalation_recipients,
            quiet_hours_enabled,
            quiet_hours_schedule,
            throttle_enabled,
            throttle_max_alerts,
            throttle_time_window_seconds,
            response_time_threshold_ms,
            response_time_window,
            warning_message_template,
            alert_message_template,
            created_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        ON CONFLICT (endpoint_id)
        DO UPDATE SET
            severity = EXCLUDED.severity,
            enabled = EXCLUDED.enabled,
            consecutive_failures_threshold = EXCLUDED.consecutive_failures_threshold,
            send_warning_on_first_failure = EXCLUDED.send_warning_on_first_failure,
            warning_channels = EXCLUDED.warning_channels,
            send_alert_on_threshold = EXCLUDED.send_alert_on_threshold,
            alert_channels = EXCLUDED.alert_channels,
            escalation_enabled = EXCLUDED.escalation_enabled,
            escalation_delay_seconds = EXCLUDED.escalation_delay_seconds,
            escalation_channels = EXCLUDED.escalation_channels,
            escalation_recipients = EXCLUDED.escalation_recipients,
            quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
            quiet_hours_schedule = EXCLUDED.quiet_hours_schedule,
            throttle_enabled = EXCLUDED.throttle_enabled,
            throttle_max_alerts = EXCLUDED.throttle_max_alerts,
            throttle_time_window_seconds = EXCLUDED.throttle_time_window_seconds,
            response_time_threshold_ms = EXCLUDED.response_time_threshold_ms,
            response_time_window = EXCLUDED.response_time_window,
            warning_message_template = EXCLUDED.warning_message_template,
            alert_message_template = EXCLUDED.alert_message_template,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
        "#
    )
    .bind(endpoint_id)
    .bind(payload.severity)
    .bind(payload.enabled.unwrap_or(true))
    .bind(payload.consecutive_failures_threshold)
    .bind(payload.send_warning_on_first_failure.unwrap_or(false))
    .bind(payload.warning_channels.unwrap_or(serde_json::json!(["slack"])))
    .bind(payload.send_alert_on_threshold.unwrap_or(true))
    .bind(payload.alert_channels.unwrap_or(serde_json::json!(["slack", "email"])))
    .bind(payload.escalation_enabled.unwrap_or(false))
    .bind(payload.escalation_delay_seconds.unwrap_or(900))
    .bind(payload.escalation_channels.unwrap_or(serde_json::json!(["email"])))
    .bind(payload.escalation_recipients.unwrap_or(serde_json::json!([])))
    .bind(payload.quiet_hours_enabled.unwrap_or(false))
    .bind(payload.quiet_hours_schedule.unwrap_or(serde_json::json!([])))
    .bind(payload.throttle_enabled.unwrap_or(false))
    .bind(payload.throttle_max_alerts.unwrap_or(3))
    .bind(payload.throttle_time_window_seconds.unwrap_or(3600))
    .bind(payload.response_time_threshold_ms)
    .bind(payload.response_time_window.unwrap_or(5))
    .bind(payload.warning_message_template)
    .bind(payload.alert_message_template)
    .bind(Some("system".to_string()))
    .fetch_one(&state.db)
    .await?;

    Ok(Json(ApiResponse::success(policy)))
}

// Get alert policy for an endpoint
pub async fn get_alert_policy(
    State(state): State<AppState>,
    Path(endpoint_id): Path<Uuid>,
) -> Result<Json<ApiResponse<AlertPolicy>>, AppError> {
    let policy: AlertPolicy = sqlx::query_as(
        "SELECT id, endpoint_id, severity, enabled, consecutive_failures_threshold,
         send_warning_on_first_failure, warning_channels, send_alert_on_threshold,
         alert_channels, escalation_enabled, escalation_delay_seconds,
         escalation_channels, escalation_recipients, quiet_hours_enabled,
         quiet_hours_schedule, throttle_enabled, throttle_max_alerts,
         throttle_time_window_seconds, response_time_threshold_ms,
         response_time_window, warning_message_template, alert_message_template,
         created_at, updated_at, created_by
         FROM alert_policies WHERE endpoint_id = $1"
    )
    .bind(endpoint_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Alert policy not found"))?;

    Ok(Json(ApiResponse::success(policy)))
}

// Delete alert policy
pub async fn delete_alert_policy(
    State(state): State<AppState>,
    Path(endpoint_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = sqlx::query(
        "DELETE FROM alert_policies WHERE endpoint_id = $1"
    )
    .bind(endpoint_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(anyhow::anyhow!("Alert policy not found").into());
    }

    Ok(StatusCode::NO_CONTENT)
}

// Get all alert policy presets
pub async fn get_alert_policy_presets(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<AlertPolicyPreset>>>, AppError> {
    let presets: Vec<AlertPolicyPreset> = sqlx::query_as(
        "SELECT id, name, severity, description, config, is_system, created_at 
         FROM alert_policy_presets ORDER BY CASE severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
        END"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(ApiResponse::success(presets)))
}
