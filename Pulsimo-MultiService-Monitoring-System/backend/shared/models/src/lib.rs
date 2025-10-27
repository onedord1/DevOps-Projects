pub mod organization;
pub mod endpoint;
pub mod health_check;
pub mod notification;
pub mod user;
pub mod auth;
pub mod event;
pub mod api_key;
pub mod project;
pub mod incident;
pub mod silence;

pub use organization::*;
pub use endpoint::*;
pub use health_check::*;
pub use notification::*;
pub use user::*;
pub use auth::*;
pub use event::*;
pub use api_key::*;
pub use project::*;
pub use incident::*;
pub use silence::*;

use serde::{Deserialize, Serialize};

/// API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: None,
        }
    }

    pub fn error(error: String) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(error),
            message: None,
        }
    }

    pub fn with_message(mut self, message: String) -> Self {
        self.message = Some(message);
        self
    }
}

/// Pagination parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page", deserialize_with = "deserialize_number_from_string")]
    pub page: u32,
    #[serde(default = "default_per_page", deserialize_with = "deserialize_number_from_string")]
    pub per_page: u32,
}

fn default_page() -> u32 {
    1
}

fn default_per_page() -> u32 {
    20
}

fn deserialize_number_from_string<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Deserialize};
    
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StringOrNumber {
        String(String),
        Number(u32),
    }
    
    match StringOrNumber::deserialize(deserializer)? {
        StringOrNumber::String(s) => s.parse::<u32>().map_err(de::Error::custom),
        StringOrNumber::Number(n) => Ok(n),
    }
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
        }
    }
}

/// Paginated response
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total_items: i64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}
