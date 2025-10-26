use anyhow::Result;
use models::{Event, NotificationChannel, NotificationChannelType, NotificationType};
use sqlx::PgPool;
use uuid::Uuid;

use crate::config::Config;
use crate::senders::{EmailSender, WebhookSender};

pub struct NotificationHandler {
    db: PgPool,
    config: Config,
    email_sender: EmailSender,
    webhook_sender: WebhookSender,
}

impl NotificationHandler {
    pub fn new(db: PgPool, config: Config) -> Self {
        let email_sender = EmailSender::new(config.clone());
        let webhook_sender = WebhookSender::new();

        Self {
            db,
            config,
            email_sender,
            webhook_sender,
        }
    }

    pub async fn handle_event(&self, event: Event) -> Result<()> {
        match &event {
            Event::EndpointDownThresholdReached { org_id, endpoint_name, endpoint_url, .. } => {
                let subject = format!("🚨 Service Down: {}", endpoint_name);
                let message = format!(
                    "Service {} ({}) is currently down and has exceeded the failure threshold.",
                    endpoint_name, endpoint_url
                );
                self.send_notifications(*org_id, NotificationType::EndpointDown, subject, message).await?;
            }
            Event::EndpointRecovered { org_id, endpoint_name, downtime_duration_seconds, .. } => {
                let subject = format!("✅ Service Recovered: {}", endpoint_name);
                let message = format!(
                    "Service {} has recovered after being down for {} seconds.",
                    endpoint_name, downtime_duration_seconds
                );
                self.send_notifications(*org_id, NotificationType::EndpointRecovered, subject, message).await?;
            }
            Event::EndpointStatusChanged { org_id, endpoint_name, new_status, .. } => {
                if *new_status == models::EndpointStatus::PartialOutage {
                    let subject = format!("⚠️ Service Degraded: {}", endpoint_name);
                    let message = format!("Service {} is experiencing partial outage.", endpoint_name);
                    self.send_notifications(*org_id, NotificationType::EndpointPartialOutage, subject, message).await?;
                }
            }
            Event::OrgMajorOutage { org_id, down_endpoints_count, total_endpoints_count, .. } => {
                let subject = "🚨 MAJOR OUTAGE DETECTED".to_string();
                let message = format!(
                    "Major outage detected: {} out of {} services are currently down.",
                    down_endpoints_count, total_endpoints_count
                );
                self.send_notifications(*org_id, NotificationType::OrgMajorOutage, subject, message).await?;
            }
            _ => {}
        }

        Ok(())
    }

    async fn send_notifications(
        &self,
        org_id: Uuid,
        notification_type: NotificationType,
        subject: String,
        message: String,
    ) -> Result<()> {
        // Fetch active notification channels for org
        let channels = sqlx::query_as::<sqlx::Postgres, models::NotificationChannel>(
            "SELECT id, org_id, name, channel_type, config, is_active, repeat_interval_minutes, created_at, updated_at FROM notification_channels WHERE org_id = $1 AND is_active = true"
        )
        .bind(org_id)
        .fetch_all(&self.db)
        .await?;

        for channel in channels {
            let notification_id = Uuid::new_v4();

            // Create notification record
            sqlx::query(
                "INSERT INTO notifications (id, org_id, channel_id, notification_type, status, subject, message) VALUES ($1, $2, $3, $4, 'pending', $5, $6)"
            )
            .bind(notification_id)
            .bind(org_id)
            .bind(channel.id)
            .bind(&notification_type)
            .bind(&subject)
            .bind(&message)
            .execute(&self.db)
            .await?;

            // Send notification
            let send_result = match channel.channel_type {
                NotificationChannelType::Email => {
                    self.email_sender.send(&channel, &subject, &message).await
                }
                NotificationChannelType::Slack | NotificationChannelType::Discord | NotificationChannelType::MsTeams | NotificationChannelType::GoogleChat => {
                    self.webhook_sender.send(&channel, &subject, &message).await
                }
                NotificationChannelType::Webhook => {
                    self.webhook_sender.send(&channel, &subject, &message).await
                }
            };

            // Update notification status
            match send_result {
                Ok(_) => {
                    sqlx::query(
                        "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1"
                    )
                    .bind(notification_id)
                    .execute(&self.db)
                    .await?;

                    tracing::info!("Notification sent via {} to org {}", channel.name, org_id);
                }
                Err(e) => {
                    sqlx::query(
                        "UPDATE notifications SET status = 'failed', error_message = $2 WHERE id = $1"
                    )
                    .bind(notification_id)
                    .bind(e.to_string())
                    .execute(&self.db)
                    .await?;

                    tracing::error!("Failed to send notification: {:?}", e);
                }
            }
        }

        Ok(())
    }
}
