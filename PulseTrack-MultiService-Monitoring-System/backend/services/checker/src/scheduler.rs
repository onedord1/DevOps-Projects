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

        let mut check_interval = interval(Duration::from_secs(10));

        loop {
            check_interval.tick().await;

            if let Err(e) = self.run_checks().await {
                tracing::error!("Error running checks: {:?}", e);
            }
        }
    }

    async fn run_checks(&self) -> Result<()> {
        // Fetch all active endpoints that need checking
        let endpoints = sqlx::query_as::<sqlx::Postgres, Endpoint>(
            "SELECT id, org_id, project_id, name, url, service_type, description, tags, owner_contact, check_interval_seconds, timeout_seconds, expected_status_code, expected_response_time_ms, failure_threshold_minutes, retry_count, retry_delay_seconds, status, last_check_at, last_status_change_at, created_at, updated_at, is_active, auth_header FROM endpoints WHERE is_active = true AND (last_check_at IS NULL OR last_check_at < NOW() - (check_interval_seconds || ' seconds')::INTERVAL) LIMIT 100"
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

        // Record in status history
        sqlx::query(
            "INSERT INTO status_history (id, endpoint_id, old_status, new_status, downtime_seconds) VALUES ($1, $2, $3, $4, $5)"
        )
        .bind(Uuid::new_v4())
        .bind(endpoint.id)
        .bind(&old_status)
        .bind(&new_status)
        .bind(downtime_seconds.map(|s| s as i32))
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
}
