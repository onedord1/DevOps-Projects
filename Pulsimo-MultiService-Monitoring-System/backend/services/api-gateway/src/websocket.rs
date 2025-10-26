use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::{IntoResponse, Response},
};
use futures::{SinkExt, StreamExt};
use serde::Deserialize;
use uuid::Uuid;

use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<AppState>,
) -> Response {
    // Verify JWT token
    let claims = match state.jwt_service.verify_token(&query.token) {
        Ok(claims) => claims,
        Err(_) => {
            return (axum::http::StatusCode::UNAUTHORIZED, "Invalid token").into_response();
        }
    };

    let org_id = match Uuid::parse_str(&claims.org_id) {
        Ok(id) => id,
        Err(_) => {
            return (axum::http::StatusCode::BAD_REQUEST, "Invalid org_id").into_response();
        }
    };

    ws.on_upgrade(move |socket| handle_socket(socket, state, org_id))
}

async fn handle_socket(socket: WebSocket, state: AppState, org_id: Uuid) {
    let (mut sender, mut receiver) = socket.split();
    let client_id = Uuid::new_v4();

    // Create channel for this client
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();

    // Register client
    {
        let mut clients = state.ws_clients.write().await;
        clients.insert(client_id, tx);
    }

    tracing::info!("WebSocket client {} connected for org {}", client_id, org_id);

    // Spawn task to send messages to client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Subscribe to Redis events for this organization
    let redis_pubsub = state.redis_pubsub.clone();
    let ws_clients = state.ws_clients.clone();
    
    let mut subscribe_task = tokio::spawn(async move {
        match redis_pubsub.subscribe(&["endpoint_events", "notification_events"]).await {
            Ok(mut pubsub) => {
                let mut stream = pubsub.on_message();
                while let Some(msg) = stream.next().await {
                    if let Ok(payload) = msg.get_payload::<String>() {
                        // Parse event and check if it belongs to this org
                        if let Ok(event_msg) = serde_json::from_str::<models::EventMessage>(&payload) {
                            if event_msg.event.org_id() == org_id {
                                // Broadcast to all clients of this org
                                let clients = ws_clients.read().await;
                                for (_, tx) in clients.iter() {
                                    let _ = tx.send(payload.clone());
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to subscribe to Redis: {:?}", e);
            }
        }
    });

    // Handle incoming messages (heartbeat, etc.)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Ping(_) => {
                    // Pong is handled automatically
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for any task to complete
    tokio::select! {
        _ = &mut send_task => {
            recv_task.abort();
            subscribe_task.abort();
        }
        _ = &mut recv_task => {
            send_task.abort();
            subscribe_task.abort();
        }
        _ = &mut subscribe_task => {
            send_task.abort();
            recv_task.abort();
        }
    }

    // Cleanup: remove client
    {
        let mut clients = state.ws_clients.write().await;
        clients.remove(&client_id);
    }

    tracing::info!("WebSocket client {} disconnected", client_id);
}
