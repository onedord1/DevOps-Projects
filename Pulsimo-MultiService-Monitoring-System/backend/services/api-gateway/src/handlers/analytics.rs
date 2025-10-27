use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use chrono::{DateTime, Duration, Utc};
use models::{ApiResponse, Claims};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;
use super::ApiResult;

#[derive(Debug, Deserialize)]
pub struct AnalyticsPeriodQuery {
    #[serde(default = "default_period")]
    period: String, // 24h, 7d, 30d, 90d
}

fn default_period() -> String {
    "24h".to_string()
}

#[derive(Debug, Serialize)]
pub struct UptimeMetrics {
    pub endpoint_id: String,
    pub endpoint_name: String,
    pub period: String,
    pub uptime_percentage: f64,
    pub total_checks: i64,
    pub successful_checks: i64,
    pub failed_checks: i64,
    pub avg_response_time_ms: Option<i32>,
    pub min_response_time_ms: Option<i32>,
    pub max_response_time_ms: Option<i32>,
    pub p95_response_time_ms: Option<i32>,
    pub total_downtime_minutes: i64,
}

#[derive(Debug, Serialize)]
pub struct ResponseTimeDataPoint {
    pub timestamp: DateTime<Utc>,
    pub avg_response_time_ms: i32,
    pub min_response_time_ms: i32,
    pub max_response_time_ms: i32,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct DowntimePeriod {
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_minutes: i32,
    pub status: String,
    pub ongoing: bool,
}

#[derive(Debug, Serialize)]
pub struct TimelineEvent {
    pub timestamp: DateTime<Utc>,
    pub event_type: String, // status_change, downtime_start, downtime_end
    pub status: String,
    pub details: Option<String>,
}

/// Get uptime metrics for an endpoint
pub async fn get_uptime_metrics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
    Query(query): Query<AnalyticsPeriodQuery>,
) -> ApiResult<UptimeMetrics> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Verify endpoint belongs to org
    let endpoint: Option<(String,)> = sqlx::query_as(
        "SELECT name FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(endpoint_id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;

    let endpoint_name = endpoint
        .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?
        .0;

    // Parse period
    let (start_time, period_str) = parse_period(&query.period)?;
    let end_time = Utc::now();

    // Calculate metrics
    let metrics: Option<(i64, i64, i64, Option<f64>, Option<i32>, Option<i32>, Option<f64>)> = sqlx::query_as(
        "SELECT 
            COUNT(*) as total_checks,
            COUNT(*) FILTER (WHERE status IN ('UP', 'HEALTHY')) as successful_checks,
            COUNT(*) FILTER (WHERE status IN ('DOWN', 'DEGRADED', 'ERROR')) as failed_checks,
            AVG(response_time_ms)::DOUBLE PRECISION as avg_response_time_ms,
            MIN(response_time_ms) as min_response_time_ms,
            MAX(response_time_ms) as max_response_time_ms,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::DOUBLE PRECISION as p95_response_time_ms
         FROM status_history
         WHERE endpoint_id = $1
           AND checked_at BETWEEN $2 AND $3"
    )
    .bind(endpoint_id)
    .bind(start_time)
    .bind(end_time)
    .fetch_optional(&state.db)
    .await?;

    let (total, successful, failed, avg_rt, min_rt, max_rt, p95_rt) = metrics.unwrap_or((0, 0, 0, None, None, None, None));

    let uptime_percentage = if total > 0 {
        (successful as f64 / total as f64) * 100.0
    } else {
        100.0
    };

    // Calculate total downtime using CTE to avoid window function in aggregate
    let downtime: Option<(Option<i64>,)> = sqlx::query_as(
        "WITH downtime_periods AS (
            SELECT 
                checked_at,
                COALESCE(LEAD(checked_at) OVER (ORDER BY checked_at), NOW()) as next_check
            FROM status_history
            WHERE endpoint_id = $1
              AND checked_at BETWEEN $2 AND $3
              AND status IN ('DOWN', 'ERROR')
         )
         SELECT SUM(EXTRACT(EPOCH FROM (next_check - checked_at))::INTEGER / 60) as downtime_minutes
         FROM downtime_periods"
    )
    .bind(endpoint_id)
    .bind(start_time)
    .bind(end_time)
    .fetch_optional(&state.db)
    .await?;

    let total_downtime = downtime.and_then(|(d,)| d).unwrap_or(0);

    let metrics = UptimeMetrics {
        endpoint_id: endpoint_id.to_string(),
        endpoint_name,
        period: period_str,
        uptime_percentage: (uptime_percentage * 100.0).round() / 100.0,
        total_checks: total,
        successful_checks: successful,
        failed_checks: failed,
        avg_response_time_ms: avg_rt.map(|v| v as i32),
        min_response_time_ms: min_rt,
        max_response_time_ms: max_rt,
        p95_response_time_ms: p95_rt.map(|v| v as i32),
        total_downtime_minutes: total_downtime,
    };

    Ok(Json(ApiResponse::success(metrics)))
}

/// Get response time data points for charting
pub async fn get_response_time_data(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
    Query(query): Query<AnalyticsPeriodQuery>,
) -> ApiResult<Vec<ResponseTimeDataPoint>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Verify endpoint belongs to org
    sqlx::query("SELECT 1 FROM endpoints WHERE id = $1 AND org_id = $2")
        .bind(endpoint_id)
        .bind(org_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    let (start_time, _) = parse_period(&query.period)?;
    let end_time = Utc::now();

    // Get data points grouped by time intervals
    let interval = determine_interval(&query.period);
    
    let data_points: Vec<(DateTime<Utc>, Option<f64>, Option<i32>, Option<i32>, String)> = sqlx::query_as(
        &format!(
            "SELECT 
                DATE_TRUNC('{}', checked_at) as timestamp,
                AVG(response_time_ms)::DOUBLE PRECISION as avg_rt,
                MIN(response_time_ms) as min_rt,
                MAX(response_time_ms) as max_rt,
                CASE 
                    WHEN COUNT(*) FILTER (WHERE status IN ('DOWN', 'ERROR')) > 0 THEN 'DOWN'
                    WHEN COUNT(*) FILTER (WHERE status = 'DEGRADED') > 0 THEN 'DEGRADED'
                    ELSE 'UP'
                END as status
             FROM status_history
             WHERE endpoint_id = $1
               AND checked_at BETWEEN $2 AND $3
             GROUP BY DATE_TRUNC('{}', checked_at)
             ORDER BY timestamp ASC",
            interval, interval
        )
    )
    .bind(endpoint_id)
    .bind(start_time)
    .bind(end_time)
    .fetch_all(&state.db)
    .await?;

    let result = data_points
        .into_iter()
        .map(|(ts, avg, min, max, status)| ResponseTimeDataPoint {
            timestamp: ts,
            avg_response_time_ms: avg.unwrap_or(0.0) as i32,
            min_response_time_ms: min.unwrap_or(0),
            max_response_time_ms: max.unwrap_or(0),
            status,
        })
        .collect();

    Ok(Json(ApiResponse::success(result)))
}

/// Get downtime periods
pub async fn get_downtime_periods(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
    Query(query): Query<AnalyticsPeriodQuery>,
) -> ApiResult<Vec<DowntimePeriod>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Verify endpoint
    sqlx::query("SELECT 1 FROM endpoints WHERE id = $1 AND org_id = $2")
        .bind(endpoint_id)
        .bind(org_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    let (start_time, _) = parse_period(&query.period)?;
    let end_time = Utc::now();

    // Find downtime periods using window functions
    let periods: Vec<(DateTime<Utc>, Option<DateTime<Utc>>, i32, String)> = sqlx::query_as(
        "WITH status_changes AS (
            SELECT 
                checked_at,
                status,
                LAG(status) OVER (ORDER BY checked_at) as prev_status,
                LEAD(checked_at) OVER (ORDER BY checked_at) as next_checked_at
            FROM status_history
            WHERE endpoint_id = $1
                AND checked_at BETWEEN $2 AND $3
            ORDER BY checked_at
        ),
        downtime_starts AS (
            SELECT 
                checked_at as down_start,
                status,
                next_checked_at
            FROM status_changes
            WHERE (prev_status IN ('UP', 'HEALTHY') OR prev_status IS NULL)
                AND status IN ('DOWN', 'DEGRADED', 'ERROR')
        )
        SELECT 
            ds.down_start,
            CASE 
                WHEN ds.next_checked_at IS NULL THEN NULL
                ELSE (
                    SELECT MIN(checked_at) 
                    FROM status_history sh2
                    WHERE sh2.endpoint_id = $1
                        AND sh2.checked_at > ds.down_start
                        AND sh2.status IN ('UP', 'HEALTHY')
                )
            END as down_end,
            EXTRACT(EPOCH FROM (
                COALESCE(
                    (SELECT MIN(checked_at) FROM status_history sh2
                     WHERE sh2.endpoint_id = $1 AND sh2.checked_at > ds.down_start AND sh2.status IN ('UP', 'HEALTHY')),
                    NOW()
                ) - ds.down_start
            ))::INTEGER / 60 as duration_minutes,
            ds.status
        FROM downtime_starts ds
        ORDER BY ds.down_start DESC
        LIMIT 100"
    )
    .bind(endpoint_id)
    .bind(start_time)
    .bind(end_time)
    .fetch_all(&state.db)
    .await?;

    let result = periods
        .into_iter()
        .map(|(start, end, duration, status)| DowntimePeriod {
            start_time: start,
            end_time: end,
            duration_minutes: duration,
            status,
            ongoing: end.is_none(),
        })
        .collect();

    Ok(Json(ApiResponse::success(result)))
}

/// Get timeline events
pub async fn get_timeline(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(endpoint_id): Path<Uuid>,
    Query(query): Query<AnalyticsPeriodQuery>,
) -> ApiResult<Vec<TimelineEvent>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    // Verify endpoint
    sqlx::query("SELECT 1 FROM endpoints WHERE id = $1 AND org_id = $2")
        .bind(endpoint_id)
        .bind(org_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    let (start_time, _) = parse_period(&query.period)?;
    let end_time = Utc::now();

    // Get status changes
    let events: Vec<(DateTime<Utc>, String, Option<String>, Option<String>)> = sqlx::query_as(
        "WITH status_changes AS (
            SELECT 
                checked_at,
                status,
                LAG(status) OVER (ORDER BY checked_at) as prev_status,
                error_message
            FROM status_history
            WHERE endpoint_id = $1
                AND checked_at BETWEEN $2 AND $3
            ORDER BY checked_at
        )
        SELECT 
            checked_at,
            status,
            prev_status,
            error_message
        FROM status_changes
        WHERE prev_status IS NULL OR prev_status != status
        ORDER BY checked_at DESC
        LIMIT 500"
    )
    .bind(endpoint_id)
    .bind(start_time)
    .bind(end_time)
    .fetch_all(&state.db)
    .await?;

    let result = events
        .into_iter()
        .map(|(ts, status, prev_status, error_msg)| {
            let event_type = if prev_status.is_none() {
                "initial_status"
            } else if status == "DOWN" || status == "ERROR" {
                "downtime_start"
            } else if prev_status.as_ref().map(|s| s.as_str()) == Some("DOWN") || 
                      prev_status.as_ref().map(|s| s.as_str()) == Some("ERROR") {
                "recovery"
            } else {
                "status_change"
            };

            let details = if let Some(prev) = prev_status {
                Some(format!("{} → {}", prev, status))
            } else {
                error_msg
            };

            TimelineEvent {
                timestamp: ts,
                event_type: event_type.to_string(),
                status,
                details,
            }
        })
        .collect();

    Ok(Json(ApiResponse::success(result)))
}

/// Helper to parse period string
fn parse_period(period: &str) -> Result<(DateTime<Utc>, String), anyhow::Error> {
    let now = Utc::now();
    let start_time = match period {
        "24h" | "1d" => now - Duration::hours(24),
        "7d" => now - Duration::days(7),
        "30d" => now - Duration::days(30),
        "90d" => now - Duration::days(90),
        _ => return Err(anyhow::anyhow!("Invalid period. Use 24h, 7d, 30d, or 90d")),
    };
    Ok((start_time, period.to_string()))
}

/// Determine aggregation interval based on period
fn determine_interval(period: &str) -> &'static str {
    match period {
        "24h" | "1d" => "minute",
        "7d" => "hour",
        "30d" => "hour",
        "90d" => "day",
        _ => "hour",
    }
}
