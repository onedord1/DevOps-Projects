use anyhow::Result;
use lettre::{
    message::header::ContentType, transport::smtp::authentication::Credentials, Message,
    SmtpTransport, Transport,
};
use models::{NotificationChannel, NotificationChannelConfig};
use reqwest::Client;
use serde_json::json;

use crate::config::Config;

pub struct EmailSender {
    config: Config,
}

impl EmailSender {
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    pub async fn send(&self, channel: &NotificationChannel, subject: &str, message: &str) -> Result<()> {
        let config: NotificationChannelConfig = serde_json::from_value(channel.config.clone())?;

        if let NotificationChannelConfig::Email { to_addresses, .. } = config {
            for email in to_addresses {
                let email_msg = Message::builder()
                    .from(format!("{} <{}>", self.config.from_name, self.config.from_email).parse()?)
                    .to(email.parse()?)
                    .subject(subject)
                    .header(ContentType::TEXT_PLAIN)
                    .body(message.to_string())?;

                let creds = Credentials::new(
                    self.config.smtp_username.clone(),
                    self.config.smtp_password.clone(),
                );

                let mailer = SmtpTransport::relay(&self.config.smtp_host)?
                    .credentials(creds)
                    .port(self.config.smtp_port)
                    .build();

                tokio::task::spawn_blocking(move || mailer.send(&email_msg))
                    .await??;
            }

            Ok(())
        } else {
            anyhow::bail!("Invalid channel config for email");
        }
    }
}

pub struct WebhookSender {
    client: Client,
}

impl WebhookSender {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    pub async fn send(&self, channel: &NotificationChannel, subject: &str, message: &str) -> Result<()> {
        let config: NotificationChannelConfig = serde_json::from_value(channel.config.clone())?;

        match config {
            NotificationChannelConfig::Slack { webhook_url, channel: slack_channel, .. } => {
                let payload = json!({
                    "text": format!("*{}*\n{}", subject, message),
                    "channel": slack_channel,
                });

                self.client
                    .post(&webhook_url)
                    .json(&payload)
                    .send()
                    .await?
                    .error_for_status()?;

                Ok(())
            }
            NotificationChannelConfig::Discord { webhook_url, .. } => {
                let payload = json!({
                    "content": format!("**{}**\n{}", subject, message),
                });

                self.client
                    .post(&webhook_url)
                    .json(&payload)
                    .send()
                    .await?
                    .error_for_status()?;

                Ok(())
            }
            NotificationChannelConfig::MsTeams { webhook_url, .. } => {
                let payload = json!({
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "title": subject,
                    "text": message,
                    "themeColor": "ff0000"
                });

                self.client
                    .post(&webhook_url)
                    .json(&payload)
                    .send()
                    .await?
                    .error_for_status()?;

                Ok(())
            }
            NotificationChannelConfig::Webhook { url, headers, .. } => {
                let mut request = self.client.post(&url);

                if let Some(headers_map) = headers {
                    if let Some(obj) = headers_map.as_object() {
                        for (key, value) in obj {
                            if let Some(value_str) = value.as_str() {
                                request = request.header(key, value_str);
                            }
                        }
                    }
                }

                let payload = json!({
                    "subject": subject,
                    "message": message,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                });

                request
                    .json(&payload)
                    .send()
                    .await?
                    .error_for_status()?;

                Ok(())
            }
            NotificationChannelConfig::GoogleChat { webhook_url, .. } => {
                let payload = json!({
                    "text": format!("*{}*\n{}", subject, message),
                });

                self.client
                    .post(&webhook_url)
                    .json(&payload)
                    .send()
                    .await?
                    .error_for_status()?;

                Ok(())
            }
            _ => anyhow::bail!("Invalid channel config for webhook"),
        }
    }
}
