use anyhow::{Context, Result};
use models::{NotificationChannelConfig, NotificationChannelType, NotificationType};
use reqwest::Client;
use serde_json::json;
use tracing::{error, info};
use lettre::{
    message::{header, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};

pub struct NotificationService {
    http_client: Client,
}

impl NotificationService {
    pub fn new() -> Self {
        Self {
            http_client: Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    pub async fn send_notification(
        &self,
        channel_type: &NotificationChannelType,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
        endpoint_url: Option<&str>,
    ) -> Result<()> {
        match channel_type {
            NotificationChannelType::Slack => {
                self.send_slack_notification(config, notification_type, subject, message, incident_id, severity, endpoint_url)
                    .await
            }
            NotificationChannelType::Discord => {
                self.send_discord_notification(config, notification_type, subject, message, incident_id, severity, endpoint_url)
                    .await
            }
            NotificationChannelType::MsTeams => {
                self.send_teams_notification(config, notification_type, subject, message, incident_id, severity, endpoint_url)
                    .await
            }
            NotificationChannelType::GoogleChat => {
                self.send_googlechat_notification(config, notification_type, subject, message, incident_id, severity)
                    .await
            }
            NotificationChannelType::Email => {
                self.send_email_notification(config, subject, message).await
            }
            NotificationChannelType::Webhook => {
                self.send_webhook_notification(config, notification_type, subject, message, incident_id, severity)
                    .await
            }
        }
    }

    async fn send_slack_notification(
        &self,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
        endpoint_url: Option<&str>,
    ) -> Result<()> {
        if let NotificationChannelConfig::Slack {
            webhook_url,
            channel,
            username,
            icon_emoji,
        } = config
        {
            let color = match severity {
                Some("critical") => "#FF0000",
                Some("high") => "#FF6B00",
                Some("medium") => "#FFA500",
                Some("low") => "#FFD700",
                _ => self.get_notification_color(notification_type),
            };

            let mut fields = vec![
                json!({
                    "title": "Type",
                    "value": format!("{:?}", notification_type),
                    "short": true
                }),
            ];

            if let Some(sev) = severity {
                fields.push(json!({
                    "title": "Severity",
                    "value": sev.to_uppercase(),
                    "short": true
                }));
            }

            if let Some(url) = endpoint_url {
                fields.push(json!({
                    "title": "Endpoint",
                    "value": format!("<{}|View Endpoint>", url),
                    "short": true
                }));
            }

            let mut attachments = vec![json!({
                "color": color,
                "title": subject,
                "text": message,
                "fields": fields,
                "footer": "Service Monitoring System",
                "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                "ts": chrono::Utc::now().timestamp()
            })];

            // Add interactive buttons for incidents
            if incident_id.is_some() {
                let actions = json!({
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "🔔 Acknowledge",
                                "emoji": true
                            },
                            "style": "primary",
                            "value": format!("acknowledge_{}", incident_id.unwrap_or(""))
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "✅ Resolve",
                                "emoji": true
                            },
                            "style": "primary",
                            "value": format!("resolve_{}", incident_id.unwrap_or(""))
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "👁️ View Details",
                                "emoji": true
                            },
                            "url": format!("http://localhost:3000/dashboard/incidents?id={}", incident_id.unwrap_or("")),
                        }
                    ]
                });
                
                // Note: For production, use Block Kit with proper interactive components
                // This simplified version shows the concept
            }

            let mut payload = json!({
                "attachments": attachments
            });

            if let Some(ch) = channel {
                payload["channel"] = json!(ch);
            }
            if let Some(uname) = username {
                payload["username"] = json!(uname);
            } else {
                payload["username"] = json!("Service Monitor");
            }
            if let Some(emoji) = icon_emoji {
                payload["icon_emoji"] = json!(emoji);
            } else {
                payload["icon_emoji"] = json!(":bell:");
            }

            let response = self.http_client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .context("Failed to send Slack notification")?;

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                anyhow::bail!("Slack API error: {}", error_text);
            }

            info!("Slack notification sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Slack configuration")
        }
    }

    async fn send_discord_notification(
        &self,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
        endpoint_url: Option<&str>,
    ) -> Result<()> {
        if let NotificationChannelConfig::Discord {
            webhook_url,
            username,
            avatar_url,
        } = config
        {
            let color_int = match severity {
                Some("critical") => 16711680, // Red
                Some("high") => 16737280, // Orange
                Some("medium") => 16753920, // Yellow
                Some("low") => 16776960, // Light Yellow
                _ => match notification_type {
                    NotificationType::EndpointDown | NotificationType::IncidentCreated => 16711680,
                    NotificationType::EndpointRecovered | NotificationType::IncidentResolved => 65280,
                    NotificationType::EndpointPartialOutage => 16753920,
                    _ => 3447003,
                },
            };

            let mut fields = vec![
                json!({
                    "name": "Type",
                    "value": format!("{:?}", notification_type),
                    "inline": true
                }),
            ];

            if let Some(sev) = severity {
                fields.push(json!({
                    "name": "Severity",
                    "value": format!("**{}**", sev.to_uppercase()),
                    "inline": true
                }));
            }

            if let Some(url) = endpoint_url {
                fields.push(json!({
                    "name": "Endpoint",
                    "value": url,
                    "inline": false
                }));
            }

            let mut embed = json!({
                "title": subject,
                "description": message,
                "color": color_int,
                "fields": fields,
                "footer": {
                    "text": "Service Monitoring System"
                },
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            // Add components (buttons) for incidents
            let mut components: Vec<serde_json::Value> = vec![];
            if incident_id.is_some() {
                let incident_url = format!("http://localhost:3000/dashboard/incidents?id={}", incident_id.unwrap_or(""));
                embed["url"] = json!(incident_url);
                
                // Discord has limited button support via webhooks
                // For full interactivity, you'd need a Discord bot
            }

            let mut payload = json!({
                "embeds": [embed],
                "components": components
            });

            if let Some(uname) = username {
                payload["username"] = json!(uname);
            } else {
                payload["username"] = json!("Service Monitor");
            }
            if let Some(avatar) = avatar_url {
                payload["avatar_url"] = json!(avatar);
            }

            let response = self.http_client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .context("Failed to send Discord notification")?;

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                anyhow::bail!("Discord API error: {}", error_text);
            }

            info!("Discord notification sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Discord configuration")
        }
    }

    async fn send_teams_notification(
        &self,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
        endpoint_url: Option<&str>,
    ) -> Result<()> {
        if let NotificationChannelConfig::MsTeams { webhook_url } = config {
            let theme_color = match severity {
                Some("critical") => "FF0000",
                Some("high") => "FF6B00",
                Some("medium") => "FFA500",
                Some("low") => "FFD700",
                _ => match notification_type {
                    NotificationType::EndpointDown | NotificationType::IncidentCreated => "D13438",
                    NotificationType::EndpointRecovered | NotificationType::IncidentResolved => "28A745",
                    NotificationType::EndpointPartialOutage => "FFA500",
                    _ => "0078D4",
                },
            };

            let mut facts = vec![
                json!({
                    "name": "Type:",
                    "value": format!("{:?}", notification_type)
                }),
            ];

            if let Some(sev) = severity {
                facts.push(json!({
                    "name": "Severity:",
                    "value": sev.to_uppercase()
                }));
            }

            if let Some(url) = endpoint_url {
                facts.push(json!({
                    "name": "Endpoint:",
                    "value": url
                }));
            }

            let mut sections = vec![json!({
                "activityTitle": subject,
                "activitySubtitle": format!("{}", chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")),
                "text": message,
                "facts": facts
            })];

            // Add potential actions for incidents
            let mut potential_actions = vec![];
            if let Some(inc_id) = incident_id {
                potential_actions.push(json!({
                    "@type": "OpenUri",
                    "name": "View Incident",
                    "targets": [
                        {
                            "os": "default",
                            "uri": format!("http://localhost:3000/dashboard/incidents?id={}", inc_id)
                        }
                    ]
                }));
            }

            let mut payload = json!({
                "@type": "MessageCard",
                "@context": "https://schema.org/extensions",
                "summary": subject,
                "themeColor": theme_color,
                "sections": sections
            });

            if !potential_actions.is_empty() {
                payload["potentialAction"] = json!(potential_actions);
            }

            let response = self.http_client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .context("Failed to send Teams notification")?;

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                anyhow::bail!("Teams API error: {}", error_text);
            }

            info!("Teams notification sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Teams configuration")
        }
    }

    async fn send_googlechat_notification(
        &self,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
    ) -> Result<()> {
        if let NotificationChannelConfig::GoogleChat { webhook_url } = config {
            let mut widgets = vec![
                json!({
                    "textParagraph": {
                        "text": format!("<b>{}</b><br>{}", subject, message)
                    }
                }),
                json!({
                    "keyValue": {
                        "topLabel": "Type",
                        "content": format!("{:?}", notification_type)
                    }
                }),
            ];

            if let Some(sev) = severity {
                widgets.push(json!({
                    "keyValue": {
                        "topLabel": "Severity",
                        "content": sev.to_uppercase()
                    }
                }));
            }

            // Add buttons for incidents
            if let Some(inc_id) = incident_id {
                widgets.push(json!({
                    "buttons": [
                        {
                            "textButton": {
                                "text": "VIEW INCIDENT",
                                "onClick": {
                                    "openLink": {
                                        "url": format!("http://localhost:3000/dashboard/incidents?id={}", inc_id)
                                    }
                                }
                            }
                        }
                    ]
                }));
            }

            let payload = json!({
                "cards": [
                    {
                        "header": {
                            "title": "Service Monitor Alert",
                            "subtitle": chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string(),
                            "imageUrl": "https://developers.google.com/chat/images/quickstart-app-avatar.png"
                        },
                        "sections": [
                            {
                                "widgets": widgets
                            }
                        ]
                    }
                ]
            });

            let response = self.http_client
                .post(webhook_url)
                .json(&payload)
                .send()
                .await
                .context("Failed to send Google Chat notification")?;

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                anyhow::bail!("Google Chat API error: {}", error_text);
            }

            info!("Google Chat notification sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Google Chat configuration")
        }
    }

    async fn send_email_notification(
        &self,
        config: &NotificationChannelConfig,
        subject: &str,
        message: &str,
    ) -> Result<()> {
        if let NotificationChannelConfig::Email {
            to_addresses,
            smtp_server,
            smtp_port,
            from_email,
        } = config
        {
            // Use provided SMTP config or fall back to environment variables
            let smtp_host = smtp_server.clone()
                .or_else(|| std::env::var("SMTP_SERVER").ok())
                .unwrap_or_else(|| "smtp.gmail.com".to_string());
            
            let smtp_port_num = smtp_port.unwrap_or_else(|| {
                std::env::var("SMTP_PORT")
                    .ok()
                    .and_then(|p| p.parse().ok())
                    .unwrap_or(587)
            });
            
            let from_addr = from_email.clone()
                .or_else(|| std::env::var("SMTP_FROM").ok())
                .unwrap_or_else(|| "noreply@monitoring.local".to_string());
            
            let smtp_username = std::env::var("SMTP_USERNAME")
                .unwrap_or_else(|_| from_addr.clone());
            let smtp_password = std::env::var("SMTP_PASSWORD")
                .unwrap_or_default();

            // Build HTML email body
            let html_body = format!(
                r#"<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
        .message {{ background: white; padding: 20px; border-radius: 4px; border-left: 4px solid #667eea; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🔔 Service Monitoring Alert</h1>
        </div>
        <div class="content">
            <div class="message">
                <p>{}</p>
            </div>
            <div class="footer">
                <p>This is an automated notification from your Service Monitoring System.</p>
                <p>Sent at: {}</p>
            </div>
        </div>
    </div>
</body>
</html>"#,
                message.replace('\n', "<br>"),
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
            );

            // Send to each recipient
            for to_addr in to_addresses {
                let email = Message::builder()
                    .from(from_addr.parse().context("Invalid from email address")?)
                    .to(to_addr.parse().context("Invalid to email address")?)
                    .subject(subject)
                    .multipart(
                        MultiPart::alternative()
                            .singlepart(
                                SinglePart::builder()
                                    .header(header::ContentType::TEXT_PLAIN)
                                    .body(message.to_string()),
                            )
                            .singlepart(
                                SinglePart::builder()
                                    .header(header::ContentType::TEXT_HTML)
                                    .body(html_body.clone()),
                            ),
                    )
                    .context("Failed to build email")?;

                // Create SMTP transport
                let creds = Credentials::new(smtp_username.clone(), smtp_password.clone());
                
                let mailer = SmtpTransport::relay(&smtp_host)
                    .context("Failed to create SMTP transport")?
                    .credentials(creds)
                    .port(smtp_port_num)
                    .build();

                // Send email
                match mailer.send(&email) {
                    Ok(_) => {
                        info!("Email sent successfully to {}", to_addr);
                    }
                    Err(e) => {
                        error!("Failed to send email to {}: {}", to_addr, e);
                        anyhow::bail!("Failed to send email: {}", e);
                    }
                }
            }

            info!("All emails sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Email configuration")
        }
    }

    async fn send_webhook_notification(
        &self,
        config: &NotificationChannelConfig,
        notification_type: &NotificationType,
        subject: &str,
        message: &str,
        incident_id: Option<&str>,
        severity: Option<&str>,
    ) -> Result<()> {
        if let NotificationChannelConfig::Webhook {
            url,
            headers,
            method,
        } = config
        {
            let payload = json!({
                "notification_type": format!("{:?}", notification_type),
                "subject": subject,
                "message": message,
                "incident_id": incident_id,
                "severity": severity,
                "timestamp": chrono::Utc::now().to_rfc3339()
            });

            let http_method = method.as_deref().unwrap_or("POST");
            
            let mut request = match http_method.to_uppercase().as_str() {
                "POST" => self.http_client.post(url),
                "PUT" => self.http_client.put(url),
                "PATCH" => self.http_client.patch(url),
                _ => self.http_client.post(url),
            };

            // Add custom headers if provided
            if let Some(custom_headers) = headers {
                if let Some(headers_map) = custom_headers.as_object() {
                    for (key, value) in headers_map {
                        if let Some(value_str) = value.as_str() {
                            request = request.header(key, value_str);
                        }
                    }
                }
            }

            let response = request
                .json(&payload)
                .send()
                .await
                .context("Failed to send webhook notification")?;

            if !response.status().is_success() {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                anyhow::bail!("Webhook error: {}", error_text);
            }

            info!("Webhook notification sent successfully");
            Ok(())
        } else {
            anyhow::bail!("Invalid Webhook configuration")
        }
    }

    fn get_notification_color(&self, notification_type: &NotificationType) -> &str {
        match notification_type {
            NotificationType::EndpointDown | NotificationType::IncidentCreated => "#D13438",
            NotificationType::EndpointRecovered | NotificationType::IncidentResolved => "#28A745",
            NotificationType::EndpointPartialOutage => "#FFA500",
            NotificationType::IncidentAcknowledged => "#0078D4",
            NotificationType::IncidentEscalated => "#FF6B00",
            NotificationType::SslCertificateExpiring => "#FFD700",
            _ => "#6C757D",
        }
    }
}

impl Default for NotificationService {
    fn default() -> Self {
        Self::new()
    }
}
