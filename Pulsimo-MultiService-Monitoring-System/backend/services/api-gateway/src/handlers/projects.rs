use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use models::{
    ApiResponse, Claims, CreateProjectRequest, PaginatedResponse, PaginationParams, Project,
    ProjectWithStats, UpdateProjectRequest,
};
use serde::Deserialize;
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
