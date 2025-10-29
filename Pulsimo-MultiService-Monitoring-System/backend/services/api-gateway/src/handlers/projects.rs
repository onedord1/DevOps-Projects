use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use models::{
    ApiResponse, Claims, CreateProjectRequest, PaginatedResponse, PaginationParams, Project,
    ProjectWithStats, UpdateProjectRequest,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tracing::{error, info};
use uuid::Uuid;
use validator::Validate;

use crate::state::AppState;

/// Query parameters for listing projects
#[derive(Debug, Deserialize)]
pub struct ListProjectsQuery {
    #[serde(flatten)]
    pub pagination: PaginationParams,
    pub status: Option<String>,
    pub priority: Option<String>,
}

/// List all projects for the authenticated organization
pub async fn list_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListProjectsQuery>,
) -> Result<Json<ApiResponse<PaginatedResponse<ProjectWithStats>>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!(
        "Listing projects for org_id: {}, page: {}, per_page: {}",
        org_id, query.pagination.page, query.pagination.per_page
    );

    let offset = (query.pagination.page - 1) * query.pagination.per_page;

    // Build query with filters
    let mut sql_query = String::from(
        r#"
        SELECT 
            p.id, p.org_id, p.name, p.slug, p.description, p.color, p.priority, 
            p.status, p.tags, p.owner_email, p.created_at, p.updated_at, p.is_active,
            COUNT(e.id) as total_endpoints,
            COUNT(CASE WHEN e.status = 'UP' THEN 1 END) as healthy_endpoints,
            COUNT(CASE WHEN e.status = 'DOWN' THEN 1 END) as down_endpoints,
            COUNT(CASE WHEN e.status = 'PARTIAL_OUTAGE' THEN 1 END) as degraded_endpoints,
            COUNT(CASE WHEN e.status = 'UNKNOWN' THEN 1 END) as unknown_endpoints,
            MAX(e.last_check_at) as last_check_at
        FROM projects p
        LEFT JOIN endpoints e ON p.id = e.project_id AND e.is_active = TRUE
        WHERE p.org_id = $1 AND p.is_active = TRUE
        "#,
    );

    let mut param_count = 1;

    if query.status.is_some() {
        param_count += 1;
        sql_query.push_str(&format!(" AND p.status = ${}", param_count));
    }

    if query.priority.is_some() {
        param_count += 1;
        sql_query.push_str(&format!(" AND p.priority = ${}", param_count));
    }

    sql_query.push_str(" GROUP BY p.id, p.org_id, p.name, p.slug, p.description, p.color, p.priority, p.status, p.tags, p.owner_email, p.created_at, p.updated_at, p.is_active");
    sql_query.push_str(" ORDER BY p.created_at DESC");

    param_count += 1;
    let limit_param = param_count;
    param_count += 1;
    let offset_param = param_count;
    sql_query.push_str(&format!(" LIMIT ${} OFFSET ${}", limit_param, offset_param));

    // Execute query
    let mut query_builder = sqlx::query_as::<_, ProjectWithStats>(&sql_query).bind(&org_id);

    if let Some(ref status) = query.status {
        query_builder = query_builder.bind(status);
    }

    if let Some(ref priority) = query.priority {
        query_builder = query_builder.bind(priority);
    }

    query_builder = query_builder
        .bind(query.pagination.per_page as i32)
        .bind(offset as i32);

    let projects = match query_builder.fetch_all(&state.db).await {
        Ok(projects) => projects,
        Err(e) => {
            error!("Failed to fetch projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get total count
    let mut count_query = String::from(
        "SELECT COUNT(*) FROM projects WHERE org_id = $1 AND is_active = TRUE",
    );

    let mut count_param = 1;
    if query.status.is_some() {
        count_param += 1;
        count_query.push_str(&format!(" AND status = ${}", count_param));
    }

    if query.priority.is_some() {
        count_param += 1;
        count_query.push_str(&format!(" AND priority = ${}", count_param));
    }

    let mut count_builder = sqlx::query_scalar::<_, i64>(&count_query).bind(&org_id);

    if let Some(ref status) = query.status {
        count_builder = count_builder.bind(status);
    }

    if let Some(ref priority) = query.priority {
        count_builder = count_builder.bind(priority);
    }

    let total = match count_builder.fetch_one(&state.db).await {
        Ok(count) => count,
        Err(e) => {
            error!("Failed to count projects: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let total_pages = (total as f64 / query.pagination.per_page as f64).ceil() as u32;

    let response = PaginatedResponse {
        items: projects,
        total_items: total,
        page: query.pagination.page,
        per_page: query.pagination.per_page,
        total_pages,
    };

    Ok(Json(ApiResponse::success(response)))
}

/// Get a single project by ID
pub async fn get_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<ApiResponse<ProjectWithStats>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!(
        "Fetching project {} for org_id: {}",
        project_id, org_id
    );

    let project = sqlx::query_as::<_, ProjectWithStats>(
        r#"
        SELECT 
            p.id, p.org_id, p.name, p.slug, p.description, p.color, p.priority, 
            p.status, p.tags, p.owner_email, p.created_at, p.updated_at, p.is_active,
            COUNT(e.id) as total_endpoints,
            COUNT(CASE WHEN e.status = 'UP' THEN 1 END) as healthy_endpoints,
            COUNT(CASE WHEN e.status = 'DOWN' THEN 1 END) as down_endpoints,
            COUNT(CASE WHEN e.status = 'PARTIAL_OUTAGE' THEN 1 END) as degraded_endpoints,
            COUNT(CASE WHEN e.status = 'UNKNOWN' THEN 1 END) as unknown_endpoints,
            MAX(e.last_check_at) as last_check_at
        FROM projects p
        LEFT JOIN endpoints e ON p.id = e.project_id AND e.is_active = TRUE
        WHERE p.id = $1 AND p.org_id = $2 AND p.is_active = TRUE
        GROUP BY p.id, p.org_id, p.name, p.slug, p.description, p.color, p.priority, 
                 p.status, p.tags, p.owner_email, p.created_at, p.updated_at, p.is_active
        "#,
    )
    .bind(&project_id)
    .bind(&org_id)
    .fetch_optional(&state.db)
    .await;

    match project {
        Ok(Some(project)) => Ok(Json(ApiResponse::success(project))),
        Ok(None) => {
            error!("Project not found: {}", project_id);
            Err(StatusCode::NOT_FOUND)
        }
        Err(e) => {
            error!("Failed to fetch project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Create a new project
pub async fn create_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateProjectRequest>,
) -> Result<Json<ApiResponse<Project>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!(
        "Creating project '{}' for org_id: {}",
        payload.name, org_id
    );

    // Validate request
    if let Err(e) = payload.validate() {
        error!("Validation error: {:?}", e);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check if slug already exists
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM projects WHERE org_id = $1 AND slug = $2 AND is_active = TRUE",
    )
    .bind(&org_id)
    .bind(&payload.slug)
    .fetch_one(&state.db)
    .await;

    match existing {
        Ok(count) if count > 0 => {
            error!("Project slug already exists: {}", payload.slug);
            return Err(StatusCode::CONFLICT);
        }
        Err(e) => {
            error!("Failed to check existing project: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }

    // Create project
    let color = payload.color.unwrap_or_else(|| "#3b82f6".to_string());
    let priority = payload
        .priority
        .map(|p| p.to_string())
        .unwrap_or_else(|| "medium".to_string());

    let project = sqlx::query_as::<_, Project>(
        r#"
        INSERT INTO projects (org_id, name, slug, description, color, priority, tags, owner_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#,
    )
    .bind(&org_id)
    .bind(&payload.name)
    .bind(&payload.slug)
    .bind(&payload.description)
    .bind(&color)
    .bind(&priority)
    .bind(&payload.tags)
    .bind(&payload.owner_email)
    .fetch_one(&state.db)
    .await;

    match project {
        Ok(project) => {
            info!("Created project: {}", project.id);
            Ok(Json(ApiResponse::success(project)))
        }
        Err(e) => {
            error!("Failed to create project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Update an existing project
pub async fn update_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Uuid>,
    Json(payload): Json<UpdateProjectRequest>,
) -> Result<Json<ApiResponse<Project>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!(
        "Updating project {} for org_id: {}",
        project_id, org_id
    );

    // Validate request
    if let Err(e) = payload.validate() {
        error!("Validation error: {:?}", e);
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check if project exists
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM projects WHERE id = $1 AND org_id = $2",
    )
    .bind(&project_id)
    .bind(&org_id)
    .fetch_one(&state.db)
    .await;

    match existing {
        Ok(0) => {
            error!("Project not found: {}", project_id);
            return Err(StatusCode::NOT_FOUND);
        }
        Err(e) => {
            error!("Failed to check project: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        _ => {}
    }

    // Build update query dynamically
    let mut updates = Vec::new();
    let mut param_count = 1;

    if payload.name.is_some() {
        param_count += 1;
        updates.push(format!("name = ${}", param_count));
    }
    if payload.description.is_some() {
        param_count += 1;
        updates.push(format!("description = ${}", param_count));
    }
    if payload.color.is_some() {
        param_count += 1;
        updates.push(format!("color = ${}", param_count));
    }
    if payload.priority.is_some() {
        param_count += 1;
        updates.push(format!("priority = ${}", param_count));
    }
    if payload.status.is_some() {
        param_count += 1;
        updates.push(format!("status = ${}", param_count));
    }
    if payload.tags.is_some() {
        param_count += 1;
        updates.push(format!("tags = ${}", param_count));
    }
    if payload.owner_email.is_some() {
        param_count += 1;
        updates.push(format!("owner_email = ${}", param_count));
    }
    if payload.is_active.is_some() {
        param_count += 1;
        updates.push(format!("is_active = ${}", param_count));
    }

    if updates.is_empty() {
        error!("No fields to update");
        return Err(StatusCode::BAD_REQUEST);
    }

    let query = format!(
        "UPDATE projects SET {} WHERE id = $1 RETURNING *",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query_as::<_, Project>(&query).bind(&project_id);

    if let Some(ref name) = payload.name {
        query_builder = query_builder.bind(name);
    }
    if let Some(ref description) = payload.description {
        query_builder = query_builder.bind(description);
    }
    if let Some(ref color) = payload.color {
        query_builder = query_builder.bind(color);
    }
    if let Some(ref priority) = payload.priority {
        query_builder = query_builder.bind(priority.to_string());
    }
    if let Some(ref status) = payload.status {
        query_builder = query_builder.bind(status.to_string());
    }
    if let Some(ref tags) = payload.tags {
        query_builder = query_builder.bind(tags);
    }
    if let Some(ref owner_email) = payload.owner_email {
        query_builder = query_builder.bind(owner_email);
    }
    if let Some(is_active) = payload.is_active {
        query_builder = query_builder.bind(is_active);
    }

    let project = query_builder.fetch_one(&state.db).await;

    match project {
        Ok(project) => {
            info!("Updated project: {}", project.id);
            Ok(Json(ApiResponse::success(project)))
        }
        Err(e) => {
            error!("Failed to update project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Delete a project (soft delete)
pub async fn delete_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!(
        "Deleting project {} for org_id: {}",
        project_id, org_id
    );

    let result = sqlx::query(
        "UPDATE projects SET is_active = FALSE WHERE id = $1 AND org_id = $2 AND is_active = TRUE",
    )
    .bind(&project_id)
    .bind(&org_id)
    .execute(&state.db)
    .await;

    match result {
        Ok(result) if result.rows_affected() > 0 => {
            info!("Deleted project: {}", project_id);
            
            // Optionally unlink endpoints from this project
            let _ = sqlx::query("UPDATE endpoints SET project_id = NULL WHERE project_id = $1")
                .bind(&project_id)
                .execute(&state.db)
                .await;

            Ok(Json(ApiResponse::success(())))
        }
        Ok(_) => {
            error!("Project not found: {}", project_id);
            Err(StatusCode::NOT_FOUND)
        }
        Err(e) => {
            error!("Failed to delete project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// ============================================================================
// Project Dashboard Statistics
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectDashboardStats {
    pub health_score: f64,
    pub total_services: i32,
    pub service_status: ServiceStatusBreakdown,
    pub uptime_30d: f64,
    pub mttr_minutes: f64,
    pub active_incidents: i32,
    pub incidents_this_month: i32,
    pub uptime_trend: Vec<UptimeTrendPoint>,
    pub top_problematic_services: Vec<ProblematicService>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceStatusBreakdown {
    pub up: i32,
    pub down: i32,
    pub degraded: i32,
    pub unknown: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UptimeTrendPoint {
    pub date: String,
    pub uptime_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProblematicService {
    pub id: String,
    pub name: String,
    pub url: String,
    pub incident_count: i32,
    pub total_downtime_minutes: i32,
    pub mttr_minutes: f64,
    pub last_incident: Option<String>,
}

/// Get comprehensive dashboard statistics for a project
pub async fn get_project_dashboard_stats(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<ApiResponse<ProjectDashboardStats>>, StatusCode> {
    let org_id = Uuid::parse_str(&claims.org_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    info!("Fetching dashboard stats for project {} (org_id: {})", project_id, org_id);

    // Verify project exists and belongs to org
    let project_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1 AND org_id = $2 AND is_active = TRUE)"
    )
    .bind(&project_id)
    .bind(&org_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        error!("Failed to verify project: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if !project_exists {
        return Err(StatusCode::NOT_FOUND);
    }

    // Get service status breakdown
    let service_status: ServiceStatusBreakdown = sqlx::query_as::<_, (i32, i32, i32, i32)>(
        r#"
        SELECT 
            COUNT(CASE WHEN status = 'UP' THEN 1 END)::int as up,
            COUNT(CASE WHEN status = 'DOWN' THEN 1 END)::int as down,
            COUNT(CASE WHEN status = 'PARTIAL_OUTAGE' THEN 1 END)::int as degraded,
            COUNT(CASE WHEN status = 'UNKNOWN' THEN 1 END)::int as unknown
        FROM endpoints
        WHERE project_id = $1 AND is_active = TRUE
        "#
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await
    .map(|(up, down, degraded, unknown)| ServiceStatusBreakdown { up, down, degraded, unknown })
    .map_err(|e| {
        error!("Failed to get service status: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let total_services = service_status.up + service_status.down + service_status.degraded + service_status.unknown;

    // Calculate health score (weighted: up=100%, degraded=50%, down/unknown=0%)
    let health_score = if total_services > 0 {
        ((service_status.up as f64 * 100.0) + (service_status.degraded as f64 * 50.0)) / total_services as f64
    } else {
        100.0
    };

    // Get 30-day uptime percentage
    let uptime_30d: f64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(
            AVG(CASE WHEN success THEN 100.0 ELSE 0.0 END), 100.0
        )
        FROM health_checks hc
        JOIN endpoints e ON hc.endpoint_id = e.id
        WHERE e.project_id = $1 
        AND e.is_active = TRUE
        AND hc.checked_at > NOW() - INTERVAL '30 days'
        "#
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(100.0);

    // Calculate MTTR (Mean Time To Recovery) in minutes
    let mttr_minutes: f64 = sqlx::query_scalar(
        r#"
        WITH incident_durations AS (
            SELECT EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 60.0 as duration_minutes
            FROM incidents i
            JOIN endpoints e ON i.endpoint_id = e.id
            WHERE e.project_id = $1
            AND i.state = 'resolved'
            AND i.resolved_at IS NOT NULL
            AND i.created_at > NOW() - INTERVAL '30 days'
        )
        SELECT COALESCE(AVG(duration_minutes), 0.0)::double precision
        FROM incident_durations
        "#
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or_else(|e| {
        error!("Failed to calculate MTTR: {}", e);
        0.0
    });
    
    info!("Project {} MTTR calculated: {} minutes", project_id, mttr_minutes);

    // Get active incidents count
    let active_incidents: i32 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::int
        FROM incidents i
        JOIN endpoints e ON i.endpoint_id = e.id
        WHERE e.project_id = $1
        AND i.state IN ('open', 'acknowledged', 'investigating')
        "#
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    // Get incidents this month
    let incidents_this_month: i32 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::int
        FROM incidents i
        JOIN endpoints e ON i.endpoint_id = e.id
        WHERE e.project_id = $1
        AND i.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        "#
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    // Get 30-day uptime trend (daily)
    let uptime_trend: Vec<UptimeTrendPoint> = sqlx::query_as::<_, (String, f64)>(
        r#"
        SELECT 
            TO_CHAR(DATE(hc.checked_at), 'YYYY-MM-DD') as date,
            AVG(CASE WHEN hc.success THEN 100.0 ELSE 0.0 END) as uptime_percentage
        FROM health_checks hc
        JOIN endpoints e ON hc.endpoint_id = e.id
        WHERE e.project_id = $1
        AND e.is_active = TRUE
        AND hc.checked_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(hc.checked_at)
        ORDER BY DATE(hc.checked_at)
        "#
    )
    .bind(&project_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|(date, uptime_percentage)| UptimeTrendPoint { date, uptime_percentage })
    .collect();

    // Get top 5 problematic services
    let top_problematic_services: Vec<ProblematicService> = sqlx::query_as::<_, (String, String, String, i32, i32, f64, Option<String>)>(
        r#"
        WITH service_incidents AS (
            SELECT 
                e.id,
                e.name,
                e.url,
                COUNT(i.id)::int as incident_count,
                COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.created_at)) / 60.0), 0)::int as total_downtime_minutes,
                COALESCE(AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 60.0) FILTER (WHERE i.state = 'resolved'), 0.0) as mttr_minutes,
                MAX(i.created_at) as last_incident
            FROM endpoints e
            LEFT JOIN incidents i ON e.id = i.endpoint_id AND i.created_at > NOW() - INTERVAL '30 days'
            WHERE e.project_id = $1 AND e.is_active = TRUE
            GROUP BY e.id, e.name, e.url
            HAVING COUNT(i.id) > 0
            ORDER BY incident_count DESC, total_downtime_minutes DESC
            LIMIT 5
        )
        SELECT 
            id::text,
            name,
            url,
            incident_count,
            total_downtime_minutes,
            mttr_minutes,
            TO_CHAR(last_incident, 'YYYY-MM-DD HH24:MI:SS')
        FROM service_incidents
        "#
    )
    .bind(&project_id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|(id, name, url, incident_count, total_downtime_minutes, mttr_minutes, last_incident)| {
        ProblematicService {
            id,
            name,
            url,
            incident_count,
            total_downtime_minutes,
            mttr_minutes,
            last_incident,
        }
    })
    .collect();

    let stats = ProjectDashboardStats {
        health_score,
        total_services,
        service_status,
        uptime_30d,
        mttr_minutes,
        active_incidents,
        incidents_this_month,
        uptime_trend,
        top_problematic_services,
    };

    Ok(Json(ApiResponse::success(stats)))
}
