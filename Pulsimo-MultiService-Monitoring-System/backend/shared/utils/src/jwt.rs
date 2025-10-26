use anyhow::Result;
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use models::{Claims, UserRole};
use uuid::Uuid;

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &str) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn generate_access_token(
        &self,
        user_id: Uuid,
        org_id: Uuid,
        email: &str,
        role: UserRole,
    ) -> Result<String> {
        let now = Utc::now().timestamp() as usize;
        let exp = now + 3600; // 1 hour

        let claims = Claims {
            sub: user_id.to_string(),
            org_id: org_id.to_string(),
            email: email.to_string(),
            role,
            exp,
            iat: now,
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    pub fn generate_refresh_token(
        &self,
        user_id: Uuid,
        org_id: Uuid,
        email: &str,
        role: UserRole,
    ) -> Result<String> {
        let now = Utc::now().timestamp() as usize;
        let exp = now + 604800; // 7 days

        let claims = Claims {
            sub: user_id.to_string(),
            org_id: org_id.to_string(),
            email: email.to_string(),
            role,
            exp,
            iat: now,
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)?;
        Ok(token)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let validation = Validation::new(Algorithm::HS256);
        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)?;
        Ok(token_data.claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_generation_and_verification() {
        let jwt_service = JwtService::new("test_secret_key_123456");
        let user_id = Uuid::new_v4();
        let org_id = Uuid::new_v4();

        let token = jwt_service
            .generate_access_token(user_id, org_id, "test@example.com", UserRole::Admin)
            .unwrap();

        let claims = jwt_service.verify_token(&token).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.org_id, org_id.to_string());
        assert_eq!(claims.email, "test@example.com");
    }
}
