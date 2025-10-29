mod config;
mod health_checker;
mod scheduler;
mod alert_policy_manager;

use anyhow::Result;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::scheduler::CheckerScheduler;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "checker=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Checker Service");

    // Load configuration
    dotenv::dotenv().ok();
    let config = Config::from_env()?;

    // Create database pool
    let db_pool = database::create_pool(&config.database_url).await?;
    tracing::info!("Database connected");

    // Create Redis client
    let redis_client = utils::RedisClient::new(&config.redis_url)?;
    tracing::info!("Redis connected");

    // Create HTTP client for health checks
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .danger_accept_invalid_certs(false)
        .build()?;

    // Create and start scheduler
    let scheduler = CheckerScheduler::new(db_pool, redis_client, http_client);
    scheduler.start().await?;

    Ok(())
}
