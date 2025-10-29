mod config;
mod handlers;
mod middleware;
mod websocket;
mod state;
mod services;

use anyhow::Result;
use axum::{
    middleware as axum_middleware,
    routing::{get, post, put, delete},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::state::AppState;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api_gateway=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenv::dotenv().ok();
    let config = Config::from_env()?;
    tracing::info!("Configuration loaded");

    // Create database pool
    let db_pool = database::create_pool(&config.database_url).await?;
    tracing::info!("Database connected");

    // Create Redis client
    let redis_client = utils::RedisClient::new(&config.redis_url)?;
    let redis_pubsub = utils::RedisPubSub::new(&config.redis_url)?;
    tracing::info!("Redis connected");

    // Create JWT service
    let jwt_service = utils::JwtService::new(&config.jwt_secret);

    // Create shared state
    let state = AppState::new(db_pool, redis_client, redis_pubsub, jwt_service);

    // Build protected routes with auth middleware
    let protected = Router::new()
        .route("/api/v1/organizations", get(handlers::organizations::list_organizations))
        .route("/api/v1/organizations/:id", get(handlers::organizations::get_organization))
        .route("/api/v1/organizations/:id", put(handlers::organizations::update_organization))
        
        .route("/api/v1/projects", get(handlers::projects::list_projects))
        .route("/api/v1/projects", post(handlers::projects::create_project))
        .route("/api/v1/projects/:id", get(handlers::projects::get_project))
        .route("/api/v1/projects/:id", put(handlers::projects::update_project))
        .route("/api/v1/projects/:id", delete(handlers::projects::delete_project))
        .route("/api/v1/projects/:id/dashboard", get(handlers::projects::get_project_dashboard_stats))
        
        .route("/api/v1/endpoints", get(handlers::endpoints::list_endpoints))
        .route("/api/v1/endpoints", post(handlers::endpoints::create_endpoint))
        .route("/api/v1/endpoints/:id", get(handlers::endpoints::get_endpoint))
        .route("/api/v1/endpoints/:id", put(handlers::endpoints::update_endpoint))
        .route("/api/v1/endpoints/:id", delete(handlers::endpoints::delete_endpoint))
        
        .route("/api/v1/endpoints/:id/history", get(handlers::health_checks::get_endpoint_history))
        .route("/api/v1/endpoints/:id/stats", get(handlers::health_checks::get_endpoint_stats))
        
        .route("/api/v1/notification-channels", get(handlers::notifications::list_channels))
        .route("/api/v1/notification-channels", post(handlers::notifications::create_channel))
        .route("/api/v1/notification-channels/:id", put(handlers::notifications::update_channel))
        .route("/api/v1/notification-channels/:id", delete(handlers::notifications::delete_channel))
        .route("/api/v1/notification-channels/test", post(handlers::notifications::test_notification))
        
        .route("/api/v1/notifications", get(handlers::notifications::list_notifications))
        .route("/api/v1/notifications/acknowledge", post(handlers::notifications::acknowledge_notifications))
        
        // Notification silences
        .route("/api/v1/silences", post(handlers::notifications::create_silence))
        .route("/api/v1/silences", get(handlers::notifications::list_silences))
        .route("/api/v1/silences/unmute", post(handlers::notifications::unmute_endpoint))
        .route("/api/v1/silences/check", get(handlers::notifications::check_silence))
        .route("/api/v1/silences/presets", get(handlers::notifications::get_silence_presets))
        .route("/api/v1/silences/endpoint/:endpoint_id", get(handlers::notifications::get_endpoint_silence_status))
        
        .route("/api/v1/users", get(handlers::users::list_users))
        .route("/api/v1/users", post(handlers::users::create_user))
        .route("/api/v1/users/:id", put(handlers::users::update_user))
        .route("/api/v1/users/:id", delete(handlers::users::delete_user))
        
        .route("/api/v1/api-keys", get(handlers::api_keys::list_api_keys))
        .route("/api/v1/api-keys", post(handlers::api_keys::create_api_key))
        .route("/api/v1/api-keys/:id", delete(handlers::api_keys::delete_api_key))
        
        .route("/api/v1/incidents", get(handlers::incidents::get_incidents))
        .route("/api/v1/incidents", post(handlers::incidents::create_incident))
        .route("/api/v1/incidents/stats", get(handlers::incidents::get_incident_stats))
        .route("/api/v1/incidents/:id", get(handlers::incidents::get_incident))
        .route("/api/v1/incidents/:id", put(handlers::incidents::update_incident))
        .route("/api/v1/incidents/:id", delete(handlers::incidents::delete_incident))
        .route("/api/v1/incidents/:id/state", put(handlers::incidents::change_incident_state))
        .route("/api/v1/incidents/:id/history", get(handlers::incidents::get_incident_history))
        .route("/api/v1/incidents/:id/acknowledge", post(handlers::incidents::acknowledge_incident))
        .route("/api/v1/incidents/:id/post-mortem", get(handlers::post_mortem::generate_post_mortem))
        
        // Analytics
        .route("/api/v1/analytics/uptime/:endpoint_id", get(handlers::analytics::get_uptime_metrics))
        .route("/api/v1/analytics/response-times/:endpoint_id", get(handlers::analytics::get_response_time_data))
        .route("/api/v1/analytics/downtime/:endpoint_id", get(handlers::analytics::get_downtime_periods))
        .route("/api/v1/analytics/timeline/:endpoint_id", get(handlers::analytics::get_timeline))
        
        // Alert Policies
        .route("/api/v1/endpoints/:endpoint_id/alert-policy", post(handlers::alert_policies::create_or_update_alert_policy))
        .route("/api/v1/endpoints/:endpoint_id/alert-policy", get(handlers::alert_policies::get_alert_policy))
        .route("/api/v1/endpoints/:endpoint_id/alert-policy", delete(handlers::alert_policies::delete_alert_policy))
        .route("/api/v1/alert-policy-presets", get(handlers::alert_policies::get_alert_policy_presets))
        
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::auth_middleware,
        ));
    
    // Build the main router
    let app = Router::new()
        // Public routes
        .route("/health", get(handlers::health::health_check))
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/auth/refresh", post(handlers::auth::refresh_token))
        
        // WebSocket
        .route("/ws", get(websocket::ws_handler))
        
        // Merge protected routes
        .merge(protected)
        
        // CORS
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        
        // Tracing
        .layer(TraceLayer::new_for_http())
        
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
