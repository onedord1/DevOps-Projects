use axum::{
    body::Body,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use models::Claims;

use crate::state::AppState;

pub async fn auth_middleware(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut req: Request,
    next: Next,
) -> Result<Response, impl IntoResponse> {
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Missing authorization header"))?;

    if !auth_header.starts_with("Bearer ") {
        return Err((StatusCode::UNAUTHORIZED, "Invalid authorization header"));
    }

    let token = &auth_header[7..];
    let claims = state
        .jwt_service
        .verify_token(token)
        .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token"))?;

    // Insert claims into request extensions
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}

// Helper to extract claims from request
pub fn extract_claims(req: &Request<Body>) -> Option<&Claims> {
    req.extensions().get::<Claims>()
}
