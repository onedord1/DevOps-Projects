pub mod health;
pub mod auth;
pub mod organizations;
pub mod endpoints;
pub mod health_checks;
pub mod notifications;
pub mod users;
pub mod api_keys;
pub mod projects;
pub mod incidents;
pub mod analytics;

use axum::{
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};
use models::ApiResponse;

pub type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

pub struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = StatusCode::INTERNAL_SERVER_ERROR;
        let body = Json(ApiResponse::<()>::error(self.0.to_string()));
        (status, body).into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}
