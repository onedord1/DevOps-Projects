mod config;
mod handlers;
mod senders;

use anyhow::Result;
use futures::StreamExt;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::handlers::NotificationHandler;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "notification=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Notification Service");

    // Load configuration
    dotenv::dotenv().ok();
    let config = Config::from_env()?;

    // Create database pool
    let db_pool = database::create_pool(&config.database_url).await?;
    tracing::info!("Database connected");

    // Create Redis pubsub
    let redis_pubsub = utils::RedisPubSub::new(&config.redis_url)?;
    tracing::info!("Redis connected");

    // Create notification handler
    let handler = NotificationHandler::new(db_pool, config);

    // Subscribe to notification events
    let mut pubsub = redis_pubsub.subscribe(&["notification_events"]).await?;
    let mut stream = pubsub.on_message();

    tracing::info!("Listening for notification events");

    while let Some(msg) = stream.next().await {
        if let Ok(payload) = msg.get_payload::<String>() {
            match serde_json::from_str::<models::EventMessage>(&payload) {
                Ok(event_msg) => {
                    if let Err(e) = handler.handle_event(event_msg.event).await {
                        tracing::error!("Error handling event: {:?}", e);
                    }
                }
                Err(e) => {
                    tracing::error!("Error parsing event: {:?}", e);
                }
            }
        }
    }

    Ok(())
}
