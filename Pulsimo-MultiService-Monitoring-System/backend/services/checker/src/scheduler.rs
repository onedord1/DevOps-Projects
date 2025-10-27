use anyhow::Result;
use chrono::Utc;
use futures::stream::{self, StreamExt};
use models::{Endpoint, EndpointStatus, Event, EventMessage};
use reqwest::Client;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use uuid::Uuid;
use utils::RedisClient;

use crate::health_checker::HealthChecker;

pub struct CheckerScheduler {
    db: PgPool,
    redis: Arc<RedisClient>,
    health_checker: Arc<HealthChecker>,
    endpoint_states: Arc<RwLock<HashMap<Uuid, EndpointState>>>,
}

struct EndpointState {
    consecutive_failures: u32,
    first_failure_at: Option<chrono::DateTime<chrono::Utc>>,
    last_status: EndpointStatus,
}

impl CheckerScheduler {
    pub fn new(db: PgPool, redis: RedisClient, http_client: Client) -> Self {
        Self {
            db,
            redis: Arc::new(redis),
            health_checker: Arc::new(HealthChecker::new(http_client)),
            endpoint_states: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn start(self) -> Result<()> {
        tracing::info!("Checker scheduler started");

        let self_arc = Arc::new(self);
        
        // Spawn health check loop
        let check_self = self_arc.clone();
        let check_task = tokio::spawn(async move {
            let mut check_interval = interval(Duration::from_secs(10));
            loop {
                check_interval.tick().await;
                if let Err(e) = check_self.run_checks().await {
                    tracing::error!("Error running checks: {:?}", e);
                }
            }
        });

        // Spawn repeat notification loop (every 5 minutes)
        let repeat_self = self_arc.clone();
        let repeat_task = tokio::spawn(async move {
            let mut repeat_interval = interval(Duration::from_secs(300)); // 5 minutes
            loop {
                repeat_interval.tick().await;
                if let Err(e) = repeat_self.send_repeat_notifications().await {
                    tracing::error!("Error sending repeat notifications: {:?}", e);
                }
            }
        });

        // Wait for both tasks
        tokio::try_join!(check_task, repeat_task)?;
        
        Ok(())
    }

    async fn run_checks(&self) -> Result<()> {
        // Fetch all active endpoints that need checking
        let endpoints = sqlx::query_as::<sqlx::Postgres, Endpoint>(
            "SELECT id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, retry_delay_seconds, status, last_check_at, last_status_change_at, created_at, updated_at, is_active, auth_header, username, password, database_name, connection_params FROM endpoints WHERE is_active = true AND (last_check_at IS NULL OR last_check_at < NOW() - (check_interval_seconds || ' seconds')::INTERVAL) LIMIT 100"
        )
        .fetch_all(&self.db)
        .await?;

        tracing::debug!("Found {} endpoints to check", endpoints.len());

        // Process checks concurrently
        let results = stream::iter(endpoints)
            .map(|endpoint| {
                let checker = self.health_checker.clone();
                let db = self.db.clone();
                let redis = self.redis.clone();
                let states = self.endpoint_states.clone();

                async move {
                    let result = checker.check_endpoint(&endpoint).await;
                    self.process_check_result(&db, &redis, &states, &endpoint, result).await
                }
            })
            .buffer_unordered(50)
            .collect::<Vec<_>>()
            .await;

        for result in results {
            if let Err(e) = result {
                tracing::error!("Error processing check result: {:?}", e);
            }
        }

        Ok(())
    }

    async fn process_check_result(
        &self,
        db: &PgPool,
        redis: &RedisClient,
        states: &RwLock<HashMap<Uuid, EndpointState>>,
        endpoint: &Endpoint,
        result: models::HealthCheckResult,
    ) -> Result<()> {
        // Save health check to database
        let check_status = if result.success {
            models::CheckStatus::Success
        } else {
            models::CheckStatus::Failure
        };

        sqlx::query(
            "INSERT INTO health_checks (id, endpoint_id, check_status, response_time_ms, status_code, failure_reason, error_message) VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(Uuid::new_v4())
        .bind(endpoint.id)
        .bind(&check_status)
        .bind(result.response_time_ms)
        .bind(result.status_code)
        .bind(&result.failure_reason)
        .bind(&result.error_message)
        .execute(db)
        .await?;

        // Record in status_history for analytics
        let status_str = format!("{:?}", endpoint.status).to_uppercase();
        sqlx::query(
            "INSERT INTO status_history (endpoint_id, status, response_time_ms, status_code, error_message, checked_at) 
             VALUES ($1, $2, $3, $4, $5, NOW())"
        )
        .bind(endpoint.id)
        .bind(&status_str)
        .bind(result.response_time_ms)
        .bind(result.status_code)
        .bind(&result.error_message)
        .execute(db)
        .await?;

        // Update endpoint last_check_at
        sqlx::query(
            "UPDATE endpoints SET last_check_at = NOW() WHERE id = $1"
        )
        .bind(endpoint.id)
        .execute(db)
        .await?;

        // Publish check completed event
        let event = Event::EndpointCheckCompleted {
            endpoint_id: endpoint.id,
            org_id: endpoint.org_id,
            success: result.success,
            response_time_ms: result.response_time_ms,
            status_code: result.status_code,
            failure_reason: result.failure_reason.clone(),
            timestamp: Utc::now(),
        };
        redis.publish("endpoint_events", &EventMessage::new(event)).await.ok();

        // Update endpoint state and check for status changes
        let mut states_guard = states.write().await;
        let state = states_guard.entry(endpoint.id).or_insert(EndpointState {
            consecutive_failures: 0,
            first_failure_at: None,
            last_status: endpoint.status.clone(),
        });

        if result.success {
            // Service is healthy
            if state.consecutive_failures > 0 {
                // Service recovered
                let downtime_seconds = if let Some(first_failure) = state.first_failure_at {
                    (Utc::now() - first_failure).num_seconds()
                } else {
                    0
                };

                state.consecutive_failures = 0;
                state.first_failure_at = None;

                if state.last_status != EndpointStatus::Up {
                    self.update_endpoint_status(
                        db,
                        redis,
                        endpoint,
                        EndpointStatus::Up,
                        Some(downtime_seconds),
                    )
                    .await?;
                    state.last_status = EndpointStatus::Up;

                    // Auto-resolve any open incidents
                    self.auto_resolve_incidents_for_endpoint(db, endpoint).await.ok();
                }
            } else if state.last_status != EndpointStatus::Up {
                // First successful check or status is not Up (e.g., Unknown)
                tracing::info!("Endpoint {} ({}) is now UP", endpoint.name, endpoint.id);
                self.update_endpoint_status(
                    db,
                    redis,
                    endpoint,
                    EndpointStatus::Up,
                    None,
                )
                .await?;
                state.last_status = EndpointStatus::Up;
            }
        } else {
            // Service failed
            state.consecutive_failures += 1;
            if state.first_failure_at.is_none() {
                state.first_failure_at = Some(Utc::now());
            }

            let downtime_seconds = if let Some(first_failure) = state.first_failure_at {
                (Utc::now() - first_failure).num_seconds()
            } else {
                0
            };

            let threshold_seconds = endpoint.failure_threshold_minutes as i64 * 60;

            // Determine new status
            let new_status = if downtime_seconds >= threshold_seconds {
                EndpointStatus::Down
            } else if state.consecutive_failures >= 2 {
                EndpointStatus::PartialOutage
            } else {
                state.last_status.clone()
            };

            // Update status if changed
            if new_status != state.last_status {
                self.update_endpoint_status(db, redis, endpoint, new_status.clone(), None).await?;
                state.last_status = new_status.clone();

                // Trigger alert if threshold reached
                if new_status == EndpointStatus::Down {
                    let event = Event::EndpointDownThresholdReached {
                        endpoint_id: endpoint.id,
                        org_id: endpoint.org_id,
                        endpoint_name: endpoint.name.clone(),
                        endpoint_url: endpoint.url.clone(),
                        downtime_seconds,
                        failure_reason: result.failure_reason.clone(),
                        error_message: result.error_message.clone(),
                        timestamp: Utc::now(),
                    };
                    redis.publish("notification_events", &EventMessage::new(event)).await.ok();

                    // Create or update incident
                    self.handle_incident_for_endpoint(db, endpoint, state.first_failure_at.unwrap(), &result).await.ok();
                }
            }
        }

        Ok(())
    }

    async fn update_endpoint_status(
        &self,
        db: &PgPool,
        redis: &RedisClient,
        endpoint: &Endpoint,
        new_status: EndpointStatus,
        downtime_seconds: Option<i64>,
    ) -> Result<()> {
        let old_status = endpoint.status.clone();

        // Update endpoint status
        sqlx::query(
            "UPDATE endpoints SET status = $1, last_status_change_at = NOW() WHERE id = $2"
        )
        .bind(&new_status)
        .bind(endpoint.id)
        .execute(db)
        .await?;

        // Publish status change event
        let event = Event::EndpointStatusChanged {
            endpoint_id: endpoint.id,
            org_id: endpoint.org_id,
            endpoint_name: endpoint.name.clone(),
            old_status,
            new_status: new_status.clone(),
            timestamp: Utc::now(),
        };
        redis.publish("endpoint_events", &EventMessage::new(event)).await.ok();

        // If recovered, send recovery notification
        if new_status == EndpointStatus::Up && downtime_seconds.is_some() {
            let event = Event::EndpointRecovered {
                endpoint_id: endpoint.id,
                org_id: endpoint.org_id,
                endpoint_name: endpoint.name.clone(),
                endpoint_url: endpoint.url.clone(),
                downtime_duration_seconds: downtime_seconds.unwrap(),
                timestamp: Utc::now(),
            };
            redis.publish("notification_events", &EventMessage::new(event)).await.ok();
        }

        Ok(())
    }

    async fn handle_incident_for_endpoint(
        &self,
        db: &PgPool,
        endpoint: &Endpoint,
        first_failure_at: chrono::DateTime<chrono::Utc>,
        result: &models::HealthCheckResult,
    ) -> Result<()> {
        // Check if there's already an open incident for this endpoint
        let existing_incident: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM incidents 
             WHERE endpoint_id = $1 
             AND state IN ('open', 'acknowledged', 'investigating') 
             ORDER BY created_at DESC 
             LIMIT 1"
        )
        .bind(endpoint.id)
        .fetch_optional(db)
        .await?;

        if let Some((incident_id,)) = existing_incident {
            // Update existing incident
            sqlx::query(
                "UPDATE incidents 
                 SET last_failure_at = NOW(), 
                     failure_count = failure_count + 1,
                     updated_at = NOW()
                 WHERE id = $1"
            )
            .bind(incident_id)
            .execute(db)
            .await?;

            tracing::debug!(
                "Updated existing incident {} for endpoint {}",
                incident_id,
                endpoint.id
            );
        } else {
            // Create new incident
            let severity = match endpoint.service_type {
                models::ServiceType::Database => "critical",
                models::ServiceType::Backend | models::ServiceType::Api => "high",
                models::ServiceType::Microservice => "medium",
                _ => "low",
            };

            let title = format!("{} is Down", endpoint.name);
            let description = match (&result.failure_reason, &result.error_message) {
                (Some(reason), Some(msg)) => format!("{}: {}", reason, msg),
                (Some(reason), None) => format!("{}", reason),
                (None, Some(msg)) => msg.clone(),
                (None, None) => "Service health check failed".to_string(),
            };

            let metadata = serde_json::json!({
                "auto_created": true,
                "service_type": endpoint.service_type,
                "url": endpoint.url,
                "failure_reason": result.failure_reason,
                "error_message": result.error_message,
            });

            let incident_id: (Uuid,) = sqlx::query_as(
                "INSERT INTO incidents 
                 (endpoint_id, title, description, severity, assigned_to, first_failure_at, last_failure_at, metadata, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'system')
                 RETURNING id"
            )
            .bind(endpoint.id)
            .bind(&title)
            .bind(&description)
            .bind(severity)
            .bind(&endpoint.owner_contact)
            .bind(first_failure_at)
            .bind(metadata)
            .fetch_one(db)
            .await?;

            // Record initial state history
            sqlx::query(
                "INSERT INTO incident_state_history (incident_id, from_state, to_state, changed_by, notes)
                 VALUES ($1, NULL, 'open', 'system', 'Incident auto-created by monitoring system')"
            )
            .bind(incident_id.0)
            .execute(db)
            .await?;

            tracing::info!(
                "Created incident {} for endpoint {} ({})",
                incident_id.0,
                endpoint.name,
                endpoint.id
            );

            // Publish incident created event
            let event = Event::Custom {
                event_type: "incident.created".to_string(),
                data: serde_json::json!({
                    "incident_id": incident_id.0,
                    "endpoint_id": endpoint.id,
                    "endpoint_name": endpoint.name,
                    "severity": severity,
                    "title": title,
                }),
                timestamp: Utc::now(),
            };
            self.redis.publish("incident_events", &EventMessage::new(event)).await.ok();
        }

        Ok(())
    }

    async fn auto_resolve_incidents_for_endpoint(
        &self,
        db: &PgPool,
        endpoint: &Endpoint,
    ) -> Result<()> {
        // Find all open incidents for this endpoint
        let open_incidents: Vec<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM incidents 
             WHERE endpoint_id = $1 
             AND state IN ('open', 'acknowledged', 'investigating')
             ORDER BY created_at DESC"
        )
        .bind(endpoint.id)
        .fetch_all(db)
        .await?;

        for (incident_id,) in open_incidents {
            // Get current state before updating
            let current_state: (String,) = sqlx::query_as(
                "SELECT state FROM incidents WHERE id = $1"
            )
            .bind(incident_id)
            .fetch_one(db)
            .await?;

            // Update incident to resolved
            sqlx::query(
                "UPDATE incidents 
                 SET state = 'resolved', 
                     resolved_at = NOW(),
                     resolution_notes = 'Auto-resolved: Service recovered and is now healthy',
                     updated_at = NOW()
                 WHERE id = $1"
            )
            .bind(incident_id)
            .execute(db)
            .await?;

            // Record state history
            sqlx::query(
                "INSERT INTO incident_state_history (incident_id, from_state, to_state, changed_by, notes)
                 VALUES ($1, $2, 'resolved', 'system', 'Auto-resolved by monitoring system')"
            )
            .bind(incident_id)
            .bind(current_state.0)
            .execute(db)
            .await?;

            tracing::info!(
                "Auto-resolved incident {} for endpoint {} ({})",
                incident_id,
                endpoint.name,
                endpoint.id
            );

            // Publish incident resolved event
            let event = Event::Custom {
                event_type: "incident.resolved".to_string(),
                data: serde_json::json!({
                    "incident_id": incident_id,
                    "endpoint_id": endpoint.id,
                    "endpoint_name": endpoint.name,
                    "resolution_type": "auto",
                }),
                timestamp: Utc::now(),
            };
            self.redis.publish("incident_events", &EventMessage::new(event)).await.ok();
        }

        Ok(())
    }

    async fn send_repeat_notifications(&self) -> Result<()> {
        // Find all DOWN endpoints
        let down_endpoints = sqlx::query_as::<sqlx::Postgres, Endpoint>(
            "SELECT e.id, e.org_id, e.project_id, e.name, e.url, e.service_type, e.description, e.tags, e.owner_contact, 
                    e.check_interval_seconds, e.timeout_seconds, e.expected_status_code, e.expected_response_time_ms, 
                    e.failure_threshold_minutes, e.retry_count, e.retry_delay_seconds, e.status, e.last_check_at, 
                    e.last_status_change_at, e.created_at, e.updated_at, e.is_active, e.auth_header, e.username, 
                    e.password, e.database_name, e.connection_params
             FROM endpoints e
             WHERE e.status = 'DOWN' 
             AND e.is_active = true
             AND e.last_status_change_at IS NOT NULL
             ORDER BY 
                 CASE e.service_type
                     WHEN 'database' THEN 1
                     WHEN 'backend' THEN 2
                     WHEN 'api' THEN 2
                     WHEN 'microservice' THEN 3
                     ELSE 4
                 END,
                 e.last_status_change_at ASC
             LIMIT 50"
        )
        .fetch_all(&self.db)
        .await?;

        if down_endpoints.is_empty() {
            tracing::debug!("No DOWN endpoints");
            return Ok(());
        }

        // Get all active notification channels with their repeat intervals
        type ChannelRow = (Uuid, Uuid, i32); // (channel_id, org_id, repeat_interval_minutes)
        let channels: Vec<ChannelRow> = sqlx::query_as(
            "SELECT id, org_id, repeat_interval_minutes FROM notification_channels WHERE is_active = true"
        )
        .fetch_all(&self.db)
        .await?;

        let mut notifications_sent = 0;

        for endpoint in down_endpoints {
            // Filter channels for this org
            let org_channels: Vec<&ChannelRow> = channels
                .iter()
                .filter(|(_, org_id, _)| *org_id == endpoint.org_id)
                .collect();

            if org_channels.is_empty() {
                continue;
            }
            // Check each channel to see if enough time has passed for repeat notification
            let mut should_send = false;
            
            for (channel_id, _, repeat_interval_minutes) in &org_channels {
                // Check when this channel last sent a notification for this endpoint
                let last_notification: Option<(chrono::DateTime<Utc>,)> = sqlx::query_as(
                    "SELECT created_at FROM notifications 
                     WHERE channel_id = $1 
                     AND notification_type = 'ENDPOINT_DOWN'
                     AND EXISTS (
                         SELECT 1 FROM incidents i 
                         WHERE i.endpoint_id = $2 
                         AND i.state IN ('open', 'acknowledged', 'investigating')
                     )
                     ORDER BY created_at DESC 
                     LIMIT 1"
                )
                .bind(channel_id)
                .bind(endpoint.id)
                .fetch_optional(&self.db)
                .await?;

                // Check if enough time has passed based on this channel's repeat interval
                let should_send_for_channel = match last_notification {
                    Some((last_sent,)) => {
                        let minutes_since = (Utc::now() - last_sent).num_minutes();
                        minutes_since >= (*repeat_interval_minutes as i64)
                    }
                    None => {
                        // No notification sent yet, check if endpoint has been down long enough
                        let downtime_minutes = endpoint.last_status_change_at
                            .map(|t| (Utc::now() - t).num_minutes())
                            .unwrap_or(0);
                        downtime_minutes >= (*repeat_interval_minutes as i64)
                    }
                };

                if should_send_for_channel {
                    should_send = true;
                    break;
                }
            }

            if !should_send {
                continue;
            }

            let downtime_seconds = if let Some(status_change_time) = endpoint.last_status_change_at {
                (Utc::now() - status_change_time).num_seconds()
            } else {
                0
            };

            let hours = downtime_seconds / 3600;
            let minutes = (downtime_seconds % 3600) / 60;
            
            let downtime_str = if hours > 0 {
                format!("{}h {}m", hours, minutes)
            } else {
                format!("{}m", minutes)
            };

            // Fetch the latest error from health_checks
            let latest_error: Option<(Option<String>,)> = sqlx::query_as(
                "SELECT error_message FROM health_checks 
                 WHERE endpoint_id = $1 
                 ORDER BY checked_at DESC 
                 LIMIT 1"
            )
            .bind(endpoint.id)
            .fetch_optional(&self.db)
            .await?;

            let error_msg = latest_error
                .and_then(|(msg,)| msg)
                .unwrap_or_else(|| "Service health check failed".to_string());

            // Send repeat notification with escalation indicator
            let event = Event::EndpointDownThresholdReached {
                endpoint_id: endpoint.id,
                org_id: endpoint.org_id,
                endpoint_name: format!("{} [STILL DOWN - {}]", endpoint.name, downtime_str),
                endpoint_url: endpoint.url.clone(),
                downtime_seconds,
                failure_reason: None,
                error_message: Some(format!(
                    "⚠️ REPEAT ALERT: Service has been down for {}. Last error: {}",
                    downtime_str, error_msg
                )),
                timestamp: Utc::now(),
            };

            self.redis
                .publish("notification_events", &EventMessage::new(event))
                .await
                .ok();

            notifications_sent += 1;

            tracing::info!(
                "Sent repeat notification for {} (down for {})",
                endpoint.name,
                downtime_str
            );
        }

        if notifications_sent > 0 {
            tracing::info!("Sent {} repeat notifications", notifications_sent);
        }

        Ok(())
    }
}
