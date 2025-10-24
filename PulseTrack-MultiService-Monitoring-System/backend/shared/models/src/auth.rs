use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::UserRole;

#[derive(Debug, Validate, Deserialize)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: Uuid,
    pub org_id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,      // user_id
    pub org_id: String,   // organization_id
    pub email: String,
    pub role: UserRole,
    pub exp: usize,       // expiration timestamp
    pub iat: usize,       // issued at timestamp
}

#[derive(Debug, Validate, Deserialize)]
pub struct RefreshTokenRequest {
    #[validate(length(min = 1))]
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
}

#[derive(Debug, Validate, Deserialize)]
pub struct RegisterOrganizationRequest {
    #[validate(length(min = 2, max = 100))]
    pub org_name: String,
    #[validate(length(min = 2, max = 50))]
    pub org_slug: String,
    #[validate(email)]
    pub org_contact_email: String,
    #[validate(email)]
    pub admin_email: String,
    #[validate(length(min = 8, max = 100))]
    pub admin_password: String,
    #[validate(length(min = 2, max = 100))]
    pub admin_name: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterOrganizationResponse {
    pub org_id: Uuid,
    pub user_id: Uuid,
    pub access_token: String,
    pub refresh_token: String,
}
