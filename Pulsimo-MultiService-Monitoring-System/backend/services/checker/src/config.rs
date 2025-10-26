use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub check_interval_seconds: u64,
    pub max_concurrent_checks: usize,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")?,
            redis_url: std::env::var("REDIS_URL")?,
            check_interval_seconds: std::env::var("CHECK_INTERVAL_SECONDS")
                .unwrap_or_else(|_| "30".to_string())
                .parse()?,
            max_concurrent_checks: std::env::var("MAX_CONCURRENT_CHECKS")
                .unwrap_or_else(|_| "100".to_string())
                .parse()?,
        })
    }
}
