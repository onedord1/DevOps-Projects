use axum::{
    extract::{Extension, Path, Query, State},
    Json,
};
use models::{
    Claims, CreateEndpointRequest, Endpoint, EndpointFilter, PaginationParams, PaginatedResponse,
    UpdateEndpointRequest,
};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;
use super::ApiResult;

pub async fn list_endpoints(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(pagination): Query<PaginationParams>,
    Query(filter): Query<EndpointFilter>,
) -> ApiResult<PaginatedResponse<Endpoint>> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let offset = (pagination.page - 1) * pagination.per_page;

    // Build query based on filters
    let mut query_builder = sqlx::QueryBuilder::new(
        r#"
        SELECT id, org_id, project_id, name, url, service_type, description, tags,
               owner_contact, check_interval_seconds, timeout_seconds,
               expected_status_code, expected_response_time_ms,
               failure_threshold_minutes, retry_count, retry_delay_seconds,
               status, last_check_at, last_status_change_at,
               created_at, updated_at, is_active, auth_header
        FROM endpoints
        WHERE org_id =
        "#,
    );
    query_builder.push_bind(org_id);

    if let Some(project_id) = filter.project_id {
        query_builder.push(" AND project_id = ");
        query_builder.push_bind(project_id);
    }

    if let Some(status) = filter.status {
        query_builder.push(" AND status = ");
        query_builder.push_bind(status);
    }

    if let Some(service_type) = filter.service_type {
        query_builder.push(" AND service_type = ");
        query_builder.push_bind(service_type);
    }

    if let Some(is_active) = filter.is_active {
        query_builder.push(" AND is_active = ");
        query_builder.push_bind(is_active);
    }

    query_builder.push(" ORDER BY created_at DESC");
    query_builder.push(" LIMIT ");
    query_builder.push_bind(pagination.per_page as i64);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset as i64);

    let endpoints = query_builder
        .build_query_as::<Endpoint>()
        .fetch_all(&state.db)
        .await?;

    // Get total count
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM endpoints WHERE org_id = $1"
    )
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    let total_pages = (total as f64 / pagination.per_page as f64).ceil() as u32;

    Ok(Json(models::ApiResponse::success(PaginatedResponse {
        items: endpoints,
        total_items: total,
        page: pagination.page,
        per_page: pagination.per_page,
        total_pages,
    })))
}

pub async fn get_endpoint(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<Endpoint> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    let endpoint = sqlx::query_as::<sqlx::Postgres, Endpoint>(
        "SELECT id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, retry_delay_seconds, status, last_check_at, last_status_change_at, created_at, updated_at, is_active, auth_header FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Endpoint not found"))?;

    Ok(Json(models::ApiResponse::success(endpoint)))
}

pub async fn create_endpoint(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateEndpointRequest>,
) -> ApiResult<Endpoint> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    create_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let id = Uuid::new_v4();
    let tags_json = create_req.tags.as_ref().map(|t| serde_json::to_value(t).unwrap());

    let endpoint = sqlx::query_as::<sqlx::Postgres, Endpoint>(
        "INSERT INTO endpoints (id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, auth_header) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, retry_delay_seconds, status, last_check_at, last_status_change_at, created_at, updated_at, is_active, auth_header"
    )
    .bind(id)
    .bind(org_id)
    .bind(&create_req.project_id)
    .bind(&create_req.name)
    .bind(&create_req.url)
    .bind(&create_req.service_type)
    .bind(&create_req.description)
    .bind(tags_json)
    .bind(&create_req.owner_contact)
    .bind(create_req.check_interval_seconds.unwrap_or(60))
    .bind(create_req.timeout_seconds.unwrap_or(10))
    .bind(create_req.expected_status_code)
    .bind(create_req.expected_response_time_ms)
    .bind(create_req.failure_threshold_minutes.unwrap_or(3))
    .bind(create_req.retry_count.unwrap_or(2))
    .bind(&create_req.auth_header)
    .fetch_one(&state.db)
    .await?;

    // Publish event for checker service
    let event = models::Event::EndpointStatusChanged {
        endpoint_id: id,
        org_id,
        endpoint_name: endpoint.name.clone(),
        old_status: models::EndpointStatus::Unknown,
        new_status: models::EndpointStatus::Unknown,
        timestamp: chrono::Utc::now(),
    };
    
    let event_msg = models::EventMessage::new(event);
    state.redis.publish("endpoint_events", &event_msg).await.ok();

    Ok(Json(models::ApiResponse::success(endpoint)))
}

pub async fn update_endpoint(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(update_req): Json<UpdateEndpointRequest>,
) -> ApiResult<Endpoint> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    update_req.validate().map_err(|e| anyhow::anyhow!(e.to_string()))?;

    // Verify endpoint exists and belongs to org
    let _existing: Option<Uuid> = sqlx::query_scalar(
        "SELECT id FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .fetch_optional(&state.db)
    .await?;
    
    if _existing.is_none() {
        return Err(anyhow::anyhow!("Endpoint not found").into());
    }

    // Build dynamic update query
    let mut query = String::from("UPDATE endpoints SET ");
    let mut updates = Vec::new();
    let mut param_count = 1;

    if let Some(name) = &update_req.name {
        updates.push(format!("name = ${}", param_count));
        param_count += 1;
    }
    if let Some(url) = &update_req.url {
        updates.push(format!("url = ${}", param_count));
        param_count += 1;
    }
    // Add other fields...

    query.push_str(&updates.join(", "));
    query.push_str(&format!(" WHERE id = ${} AND org_id = ${}", param_count, param_count + 1));
    query.push_str(" RETURNING *");

    // For simplicity, use a simpler approach
    let tags_json = update_req.tags.as_ref().map(|t| serde_json::to_value(t).unwrap());
    
    let endpoint = sqlx::query_as::<sqlx::Postgres, Endpoint>(
        "UPDATE endpoints SET project_id = COALESCE($1, project_id), name = COALESCE($2, name), url = COALESCE($3, url), service_type = COALESCE($4, service_type), description = COALESCE($5, description), tags = COALESCE($6, tags), check_interval_seconds = COALESCE($7, check_interval_seconds), timeout_seconds = COALESCE($8, timeout_seconds), expected_status_code = COALESCE($9, expected_status_code), expected_response_time_ms = COALESCE($10, expected_response_time_ms), is_active = COALESCE($11, is_active), auth_header = COALESCE($12, auth_header) WHERE id = $13 AND org_id = $14 RETURNING id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, retry_delay_seconds, status, last_check_at, last_status_change_at, created_at, updated_at, is_active, auth_header"
    )
    .bind(&update_req.project_id)
    .bind(&update_req.name)
    .bind(&update_req.url)
    .bind(&update_req.service_type)
    .bind(&update_req.description)
    .bind(tags_json)
    .bind(update_req.check_interval_seconds)
    .bind(update_req.timeout_seconds)
    .bind(update_req.expected_status_code)
    .bind(update_req.expected_response_time_ms)
    .bind(update_req.is_active)
    .bind(&update_req.auth_header)
    .bind(id)
    .bind(org_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(endpoint)))
}

pub async fn delete_endpoint(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> ApiResult<()> {
    let org_id = Uuid::parse_str(&claims.org_id)?;

    sqlx::query(
        "DELETE FROM endpoints WHERE id = $1 AND org_id = $2"
    )
    .bind(id)
    .bind(org_id)
    .execute(&state.db)
    .await?;

    Ok(Json(models::ApiResponse::success(())))
}
