use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use models::{
    ApiResponse, ChangeIncidentStateRequest, CreateIncidentRequest, Incident,
    IncidentStateHistory, IncidentStats, IncidentWithEndpoint, PaginatedResponse,
    PaginationParams, UpdateIncidentRequest,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct IncidentQueryParams {
    #[serde(flatten)]
    pub pagination: PaginationParams,
    pub state: Option<String>,
    pub severity: Option<String>,
    pub endpoint_id: Option<Uuid>,
    pub assigned_to: Option<String>,
}

/// Get all incidents with pagination and filters
pub async fn get_incidents(
    State(state): State<AppState>,
    Query(params): Query<IncidentQueryParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let offset = ((params.pagination.page - 1) * params.pagination.per_page) as i64;
    let limit = params.pagination.per_page as i64;

    // Build query with filters
    let mut query = String::from(
        "SELECT i.*, e.name as endpoint_name, e.url as endpoint_url, e.service_type as endpoint_service_type
         FROM incidents i
         JOIN endpoints e ON i.endpoint_id = e.id
         WHERE 1=1",
    );
    let mut count_query = String::from("SELECT COUNT(*) FROM incidents i WHERE 1=1");

    if let Some(ref state_filter) = params.state {
        query.push_str(&format!(" AND i.state = '{}'", state_filter));
        count_query.push_str(&format!(" AND state = '{}'", state_filter));
    }

    if let Some(ref severity) = params.severity {
        query.push_str(&format!(" AND i.severity = '{}'", severity));
        count_query.push_str(&format!(" AND severity = '{}'", severity));
    }

    if let Some(endpoint_id) = params.endpoint_id {
        query.push_str(&format!(" AND i.endpoint_id = '{}'", endpoint_id));
        count_query.push_str(&format!(" AND endpoint_id = '{}'", endpoint_id));
    }

    if let Some(ref assigned_to) = params.assigned_to {
        query.push_str(&format!(" AND i.assigned_to = '{}'", assigned_to));
        count_query.push_str(&format!(" AND assigned_to = '{}'", assigned_to));
    }

    query.push_str(" ORDER BY i.created_at DESC");
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let incidents: Vec<IncidentWithEndpoint> = sqlx::query_as(&query)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    let total_count: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    let total_pages = (total_count.0 as f64 / params.pagination.per_page as f64).ceil() as u32;

    Ok(Json(ApiResponse::success(PaginatedResponse {
        items: incidents,
        total_items: total_count.0,
        page: params.pagination.page,
        per_page: params.pagination.per_page,
        total_pages,
    })))
}

/// Get single incident by ID
pub async fn get_incident(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let incident: IncidentWithEndpoint = sqlx::query_as(
        "SELECT i.*, e.name as endpoint_name, e.url as endpoint_url, e.service_type as endpoint_service_type
         FROM incidents i
         JOIN endpoints e ON i.endpoint_id = e.id
         WHERE i.id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
        )
    })?
    .ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error("Incident not found".to_string())),
        )
    })?;

    Ok(Json(ApiResponse::success(incident)))
}

/// Create a new incident manually
pub async fn create_incident(
    State(state): State<AppState>,
    Json(payload): Json<CreateIncidentRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let incident: Incident = sqlx::query_as(
        "INSERT INTO incidents 
         (endpoint_id, title, description, severity, assigned_to, first_failure_at, last_failure_at, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'manual')
         RETURNING *",
    )
    .bind(payload.endpoint_id)
    .bind(payload.title)
    .bind(payload.description)
    .bind(payload.severity.to_string())
    .bind(payload.assigned_to)
    .bind(payload.first_failure_at)
    .bind(payload.metadata.unwrap_or(serde_json::json!({})))
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Failed to create incident: {}", e))),
        )
    })?;

    // Record state history
    let _: IncidentStateHistory = sqlx::query_as(
        "INSERT INTO incident_state_history (incident_id, from_state, to_state, changed_by, notes)
         VALUES ($1, NULL, $2, $3, $4)
         RETURNING *",
    )
    .bind(incident.id)
    .bind("open")
    .bind("manual")
    .bind("Incident created manually")
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Failed to record state history: {}", e))),
        )
    })?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(incident))))
}

/// Update incident details
pub async fn update_incident(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateIncidentRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    // Check if incident exists
    let existing: Option<Incident> = sqlx::query_as("SELECT * FROM incidents WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    if existing.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error("Incident not found".to_string())),
        ));
    }

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut values: Vec<String> = Vec::new();

    if let Some(title) = payload.title {
        updates.push(format!("title = ${}", updates.len() + 1));
        values.push(title);
    }
    if let Some(description) = payload.description {
        updates.push(format!("description = ${}", updates.len() + 1));
        values.push(description);
    }
    if let Some(severity) = payload.severity {
        updates.push(format!("severity = ${}", updates.len() + 1));
        values.push(severity.to_string());
    }
    if let Some(assigned_to) = payload.assigned_to {
        updates.push(format!("assigned_to = ${}", updates.len() + 1));
        values.push(assigned_to);
    }
    if let Some(resolution_notes) = payload.resolution_notes {
        updates.push(format!("resolution_notes = ${}", updates.len() + 1));
        values.push(resolution_notes);
    }

    if updates.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error("No fields to update".to_string())),
        ));
    }

    updates.push("updated_at = CURRENT_TIMESTAMP".to_string());

    let query = format!(
        "UPDATE incidents SET {} WHERE id = ${}",
        updates.join(", "),
        updates.len() + 1
    );

    let mut query_builder = sqlx::query(&query);
    for value in values {
        query_builder = query_builder.bind(value);
    }
    query_builder = query_builder.bind(id);

    query_builder.execute(&state.db).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Failed to update incident: {}", e))),
        )
    })?;

    // Fetch updated incident
    let incident: Incident = sqlx::query_as("SELECT * FROM incidents WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success(incident)))
}

/// Change incident state
pub async fn change_incident_state(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ChangeIncidentStateRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    // Fetch current incident
    let incident: Incident = sqlx::query_as("SELECT * FROM incidents WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::<()>::error("Incident not found".to_string())),
            )
        })?;

    // Validate state transition
    if !incident.state.can_transition_to(&payload.state) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(format!(
                "Cannot transition from {} to {}",
                incident.state, payload.state
            ))),
        ));
    }

    let now = Utc::now();
    let new_state_str = payload.state.to_string();

    // Update incident state with timestamps
    let mut query = format!("UPDATE incidents SET state = '{}', updated_at = $1", new_state_str);
    
    match payload.state {
        models::IncidentState::Acknowledged => {
            query.push_str(", acknowledged_at = $1");
        }
        models::IncidentState::Investigating => {
            query.push_str(", investigating_started_at = $1");
        }
        models::IncidentState::Resolved => {
            query.push_str(", resolved_at = $1");
        }
        models::IncidentState::Closed => {
            query.push_str(", closed_at = $1");
        }
        _ => {}
    }

    query.push_str(" WHERE id = $2 RETURNING *");

    let updated_incident: Incident = sqlx::query_as(&query)
        .bind(now)
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Failed to update state: {}", e))),
            )
        })?;

    // Record state history
    let _: IncidentStateHistory = sqlx::query_as(
        "INSERT INTO incident_state_history (incident_id, from_state, to_state, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *",
    )
    .bind(id)
    .bind(incident.state.to_string())
    .bind(new_state_str)
    .bind(payload.changed_by.unwrap_or_else(|| "system".to_string()))
    .bind(payload.notes)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Failed to record state history: {}", e))),
        )
    })?;

    Ok(Json(ApiResponse::success(updated_incident)))
}

/// Get incident state history
pub async fn get_incident_history(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let history: Vec<IncidentStateHistory> = sqlx::query_as(
        "SELECT * FROM incident_state_history WHERE incident_id = $1 ORDER BY changed_at ASC",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
        )
    })?;

    Ok(Json(ApiResponse::success(history)))
}

/// Get incident statistics
pub async fn get_incident_stats(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let stats: IncidentStats = sqlx::query_as(
        r#"
        SELECT 
            COUNT(*) as total_incidents,
            COUNT(*) FILTER (WHERE state = 'open') as open_incidents,
            COUNT(*) FILTER (WHERE state = 'acknowledged') as acknowledged_incidents,
            COUNT(*) FILTER (WHERE state = 'investigating') as investigating_incidents,
            COUNT(*) FILTER (WHERE state = 'resolved' AND DATE(resolved_at) = CURRENT_DATE) as resolved_today,
            COUNT(*) FILTER (WHERE severity = 'critical' AND state NOT IN ('resolved', 'closed')) as critical_incidents,
            CAST(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL) AS DOUBLE PRECISION) as avg_resolution_time_minutes
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '30 days'
        "#,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
        )
    })?;

    Ok(Json(ApiResponse::success(stats)))
}

/// Acknowledge incident
pub async fn acknowledge_incident(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    // Check if incident exists and is open
    let incident: Option<(String,)> = sqlx::query_as("SELECT state FROM incidents WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    if incident.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error("Incident not found".to_string())),
        ));
    }

    // Update incident to acknowledged state
    let assigned_to = payload.get("assigned_to").and_then(|v| v.as_str());
    
    let query = if let Some(assignee) = assigned_to {
        sqlx::query(
            "UPDATE incidents 
             SET state = 'acknowledged', 
                 acknowledged_at = NOW(),
                 assigned_to = $2,
                 updated_at = NOW()
             WHERE id = $1"
        )
        .bind(id)
        .bind(assignee)
    } else {
        sqlx::query(
            "UPDATE incidents 
             SET state = 'acknowledged', 
                 acknowledged_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1"
        )
        .bind(id)
    };

    query.execute(&state.db).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
        )
    })?;

    // Record state history
    sqlx::query(
        "INSERT INTO incident_state_history (incident_id, from_state, to_state, changed_by, notes)
         VALUES ($1, $2, 'acknowledged', 'system', 'Incident acknowledged')"
    )
    .bind(id)
    .bind(incident.unwrap().0)
    .execute(&state.db)
    .await
    .ok();

    Ok(Json(ApiResponse::success(())))
}

/// Delete incident (admin only)
pub async fn delete_incident(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM incidents WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Database error: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error("Incident not found".to_string())),
        ));
    }

    Ok(Json(ApiResponse::success(())))
}
