use anyhow::Result;
use dashmap::DashMap;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

static FAILURE_COUNTS: Lazy<DashMap<Uuid, i32>> = Lazy::new(DashMap::new);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertPolicy {
    pub id: Uuid,
    pub endpoint_id: Uuid,
    pub severity: String,
    pub enabled: bool,
    pub consecutive_failures_threshold: i32,
    pub send_warning_on_first_failure: bool,
    pub warning_channels: serde_json::Value,
    pub send_alert_on_threshold: bool,
    pub alert_channels: serde_json::Value,
    pub escalation_enabled: bool,
    pub escalation_delay_seconds: i32,
    pub escalation_channels: serde_json::Value,
    pub response_time_threshold_ms: Option<i32>,
}

pub struct AlertPolicyManager;

impl AlertPolicyManager {
    pub async fn load_policy(endpoint_id: Uuid, pool: &PgPool) -> Option<AlertPolicy> {
        let result: Option<(
            Uuid, Uuid, String, bool, i32, bool, serde_json::Value,
            bool, serde_json::Value, bool, i32, serde_json::Value, Option<i32>
        )> = sqlx::query_as(
            r#"
            SELECT id, endpoint_id, severity, enabled,
                   consecutive_failures_threshold,
                   send_warning_on_first_failure, warning_channels,
                   send_alert_on_threshold, alert_channels,
                   escalation_enabled, escalation_delay_seconds,
                   escalation_channels, response_time_threshold_ms
            FROM alert_policies
            WHERE endpoint_id = $1 AND enabled = true
            "#
        )
        .bind(endpoint_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

        result.map(|(id, endpoint_id, severity, enabled, consecutive_failures_threshold,
                     send_warning_on_first_failure, warning_channels,
                     send_alert_on_threshold, alert_channels,
                     escalation_enabled, escalation_delay_seconds,
                     escalation_channels, response_time_threshold_ms)| {
            AlertPolicy {
                id,
                endpoint_id,
                severity,
                enabled,
                consecutive_failures_threshold,
                send_warning_on_first_failure,
                warning_channels,
                send_alert_on_threshold,
                alert_channels,
                escalation_enabled,
                escalation_delay_seconds,
                escalation_channels,
                response_time_threshold_ms,
            }
        })
    }

    pub fn get_failure_count(endpoint_id: Uuid) -> i32 {
        FAILURE_COUNTS.get(&endpoint_id).map(|v| *v).unwrap_or(0)
    }

    pub fn increment_failure_count(endpoint_id: Uuid) -> i32 {
        FAILURE_COUNTS
            .entry(endpoint_id)
            .and_modify(|c| *c += 1)
            .or_insert(1);
        Self::get_failure_count(endpoint_id)
    }

    pub fn reset_failure_count(endpoint_id: Uuid) {
        FAILURE_COUNTS.remove(&endpoint_id);
    }

    pub fn default_policy() -> AlertPolicy {
        AlertPolicy {
            id: Uuid::new_v4(),
            endpoint_id: Uuid::new_v4(),
            severity: "medium".to_string(),
            enabled: true,
            consecutive_failures_threshold: 3,
            send_warning_on_first_failure: false,
            warning_channels: serde_json::json!(["slack"]),
            send_alert_on_threshold: true,
            alert_channels: serde_json::json!(["slack", "email"]),
            escalation_enabled: false,
            escalation_delay_seconds: 900,
            escalation_channels: serde_json::json!(["email"]),
            response_time_threshold_ms: None,
        }
    }

    pub async fn check_throttling(
        endpoint_id: Uuid,
        _policy: &AlertPolicy,
        pool: &PgPool,
    ) -> Result<bool> {
        let count: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)::bigint
            FROM alert_history
            WHERE endpoint_id = $1
              AND alert_type = 'alert'
              AND created_at > NOW() - INTERVAL '1 hour'
            "#
        )
        .bind(endpoint_id)
        .fetch_one(pool)
        .await?;

        Ok(count.0 >= 3)
    }

    pub async fn log_alert(
        endpoint_id: Uuid,
        policy_id: Uuid,
        alert_type: &str,
        channels: &serde_json::Value,
        message: &str,
        pool: &PgPool,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO alert_history
                (endpoint_id, alert_policy_id, alert_type, channels, message, sent_successfully)
            VALUES ($1, $2, $3, $4, $5, true)
            "#
        )
        .bind(endpoint_id)
        .bind(policy_id)
        .bind(alert_type)
        .bind(channels)
        .bind(message)
        .execute(pool)
        .await?;

        Ok(())
    }
}
