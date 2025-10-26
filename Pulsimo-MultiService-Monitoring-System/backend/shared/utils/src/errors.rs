use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Redis error: {0}")]
    RedisError(#[from] redis::RedisError),

    #[error("JWT error: {0}")]
    JwtError(#[from] jsonwebtoken::errors::Error),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Authentication failed")]
    AuthenticationError,

    #[error("Authorization failed: {0}")]
    AuthorizationError(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    InternalError(String),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
