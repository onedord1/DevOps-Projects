use axum::{extract::{Extension, Path, Query, State}, Json};
use models::{Claims, HealthCheckHistory, UptimeStats};
use uuid::Uuid;

use crate::state::AppState;
use super::ApiResult;

#[derive(serde::Deserialize)]
pub struct HistoryQuery {
    pub days: Option<i32>,
}

pub async fn get_endpoint_history(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
    Query(query): Query<HistoryQuery>,
) -> ApiResult<HealthCheckHistory> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let days = query.days.unwrap_or(7);
    let start_date = chrono::Utc::now() - chrono::Duration::days(days as i64);

    // Verify endpoint belongs to org
    let endpoint_name: String = sqlx::query_scalar(
        "SELECT name FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(endpoint_id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    let checks = sqlx::query_as::<sqlx::Postgres, models::HealthCheck>(
        "SELECT id, endpoint_id, check_status, response_time_ms, status_code, failure_reason, error_message, checked_at FROM health_checks WHERE endpoint_id = $1 AND checked_at >= $2 ORDER BY checked_at DESC LIMIT 1000"
    )
    .bind(endpoint_id)
    .bind(start_date)
    .fetch_all(&state.db)
    .await?;

    let total_checks = checks.len() as i64;
    let successful_checks = checks.iter().filter(|c| c.check_status == models::CheckStatus::Success).count() as i64;
    let failed_checks = total_checks - successful_checks;
    
    let avg_response_time_ms = if !checks.is_empty() {
        let sum: i32 = checks.iter()
            .filter_map(|c| c.response_time_ms)
            .sum();
        Some(sum as f64 / checks.len() as f64)
    } else {
        None
    };

    let uptime_percentage = if total_checks > 0 {
        (successful_checks as f64 / total_checks as f64) * 100.0
    } else {
        0.0
    };

    Ok(Json(models::ApiResponse::success(HealthCheckHistory {
        endpoint_id,
        endpoint_name,
        checks,
        total_checks,
        successful_checks,
        failed_checks,
        avg_response_time_ms,
        uptime_percentage,
    })))
}

pub async fn get_endpoint_stats(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
) -> ApiResult<UptimeStats> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Verify endpoint belongs to org
    let exists: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(endpoint_id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;
    
    if exists.is_none() {
        return Err(anyhow::anyhow!("Endpoint not found").into());
    }

    let period_start = chrono::Utc::now() - chrono::Duration::days(30);
    let period_end = chrono::Utc::now();

    // Calculate uptime stats (simplified)
    let total_checks: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM health_checks WHERE endpoint_id = $1 AND checked_at >= $2"
    )
    .bind(endpoint_id)
    .bind(period_start)
    .fetch_one(&state.db)
    .await?;

    let successful_checks: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM health_checks WHERE endpoint_id = $1 AND checked_at >= $2 AND check_status = 'success'"
    )
    .bind(endpoint_id)
    .bind(period_start)
    .fetch_one(&state.db)
    .await?;

    let avg_response: Option<f64> = sqlx::query_scalar(
        "SELECT AVG(response_time_ms) FROM health_checks WHERE endpoint_id = $1 AND checked_at >= $2"
    )
    .bind(endpoint_id)
    .bind(period_start)
    .fetch_one(&state.db)
    .await
    .ok();

    let uptime_percentage = if total_checks > 0 {
        (successful_checks as f64 / total_checks as f64) * 100.0
    } else {
        0.0
    };

    Ok(Json(models::ApiResponse::success(UptimeStats {
        endpoint_id,
        period_start,
        period_end,
        total_uptime_seconds: 0, // Would calculate from status_history
        total_downtime_seconds: 0,
        uptime_percentage,
        incident_count: 0,
        avg_response_time_ms: avg_response,
    })))
}
