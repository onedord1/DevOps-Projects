use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use utils::{JwtService, RedisClient, RedisPubSub};
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub redis: Arc<RedisClient>,
    pub redis_pubsub: Arc<RedisPubSub>,
    pub jwt_service: Arc<JwtService>,
    pub ws_clients: Arc<RwLock<WsClients>>,
}

impl AppState {
    pub fn new(
        db: PgPool,
        redis: RedisClient,
        redis_pubsub: RedisPubSub,
        jwt_service: JwtService,
    ) -> Self {
        Self {
            db,
            redis: Arc::new(redis),
            redis_pubsub: Arc::new(redis_pubsub),
            jwt_service: Arc::new(jwt_service),
            ws_clients: Arc::new(RwLock::new(WsClients::default())),
        }
    }
}

// WebSocket clients manager
pub type WsClients = std::collections::HashMap<Uuid, tokio::sync::mpsc::UnboundedSender<String>>;
