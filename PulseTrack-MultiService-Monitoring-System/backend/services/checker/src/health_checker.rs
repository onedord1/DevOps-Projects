use anyhow::Result;
use chrono::Utc;
use models::{CheckStatus, Endpoint, FailureReason, HealthCheckResult, ServiceType};
use reqwest::Client;
use std::time::{Duration, Instant};
use uuid::Uuid;
use sqlx::{Connection, PgConnection, MySqlConnection};

pub struct HealthChecker {
    client: Client,
}

impl HealthChecker {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn check_endpoint(&self, endpoint: &Endpoint) -> HealthCheckResult {
        let start = Instant::now();
        let timeout = Duration::from_secs(endpoint.timeout_seconds as u64);

        // Route to appropriate check based on service type
        let result = match endpoint.service_type {
            ServiceType::Database => {
                tokio::time::timeout(timeout, self.perform_database_check(endpoint)).await
            }
            _ => {
                tokio::time::timeout(timeout, self.perform_http_check(endpoint)).await
            }
        };

        let elapsed = start.elapsed();
        let response_time_ms = elapsed.as_millis() as i32;

        match result {
            Ok(Ok(check_result)) => {
                // Check if response time exceeds expected
                if let Some(expected_time) = endpoint.expected_response_time_ms {
                    if response_time_ms > expected_time {
                        return HealthCheckResult {
                            endpoint_id: endpoint.id,
                            success: false,
                            response_time_ms: Some(response_time_ms),
                            status_code: check_result.status_code,
                            failure_reason: Some(FailureReason::ResponseTimeExceeded),
                            error_message: Some(format!(
                                "Response time {}ms exceeds expected {}ms",
                                response_time_ms, expected_time
                            )),
                            timestamp: Utc::now(),
                        };
                    }
                }

                // Check if status code matches expected
                if let Some(expected_code) = endpoint.expected_status_code {
                    if let Some(actual_code) = check_result.status_code {
                        if actual_code != expected_code {
                            return HealthCheckResult {
                                endpoint_id: endpoint.id,
                                success: false,
                                response_time_ms: Some(response_time_ms),
                                status_code: Some(actual_code),
                                failure_reason: Some(FailureReason::UnexpectedStatusCode),
                                error_message: Some(format!(
                                    "Expected status code {}, got {}",
                                    expected_code, actual_code
                                )),
                                timestamp: Utc::now(),
                            };
                        }
                    }
                }

                HealthCheckResult {
                    endpoint_id: endpoint.id,
                    success: true,
                    response_time_ms: Some(response_time_ms),
                    status_code: check_result.status_code,
                    failure_reason: None,
                    error_message: None,
                    timestamp: Utc::now(),
                }
            }
            Ok(Err(e)) => HealthCheckResult {
                endpoint_id: endpoint.id,
                success: false,
                response_time_ms: Some(response_time_ms),
                status_code: None,
                failure_reason: Some(categorize_error(&e)),
                error_message: Some(e.to_string()),
                timestamp: Utc::now(),
            },
            Err(_) => HealthCheckResult {
                endpoint_id: endpoint.id,
                success: false,
                response_time_ms: Some(response_time_ms),
                status_code: None,
                failure_reason: Some(FailureReason::Timeout),
                error_message: Some(format!(
                    "Request timed out after {}s",
                    endpoint.timeout_seconds
                )),
                timestamp: Utc::now(),
            },
        }
    }

    async fn perform_http_check(&self, endpoint: &Endpoint) -> Result<CheckResult> {
        let mut request = self.client.get(&endpoint.url);
        
        // Add Authorization header if auth_header is configured
        if let Some(auth_header) = &endpoint.auth_header {
            request = request.header("Authorization", auth_header);
        }
        
        let response = request.send().await?;

        let status_code = response.status().as_u16() as i32;

        // Consider 2xx and 3xx as success
        if response.status().is_success() || response.status().is_redirection() {
            Ok(CheckResult {
                status_code: Some(status_code),
            })
        } else {
            anyhow::bail!("HTTP error: {}", status_code)
        }
    }

    async fn perform_database_check(&self, endpoint: &Endpoint) -> Result<CheckResult> {
        // Detect database type from URL
        let url = &endpoint.url;
        
        if url.starts_with("postgresql://") || url.starts_with("postgres://") {
            self.check_postgresql(endpoint).await
        } else if url.starts_with("mysql://") {
            self.check_mysql(endpoint).await
        } else {
            anyhow::bail!("Unsupported database URL format: {}", url)
        }
    }

    async fn check_postgresql(&self, endpoint: &Endpoint) -> Result<CheckResult> {
        // Build connection string from endpoint data
        let conn_str = self.build_postgres_connection_string(endpoint)?;
        
        // Attempt to connect
        let mut conn = PgConnection::connect(&conn_str).await.map_err(|e| {
            anyhow::anyhow!("PostgreSQL connection failed: {}", e)
        })?;

        // Execute simple query to verify connection
        sqlx::query("SELECT 1")
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow::anyhow!("PostgreSQL query failed: {}", e))?;

        conn.close().await.ok();

        Ok(CheckResult {
            status_code: None, // Databases don't have HTTP status codes
        })
    }

    async fn check_mysql(&self, endpoint: &Endpoint) -> Result<CheckResult> {
        // Build connection string from endpoint data
        let conn_str = self.build_mysql_connection_string(endpoint)?;
        
        // Attempt to connect
        let mut conn = MySqlConnection::connect(&conn_str).await.map_err(|e| {
            anyhow::anyhow!("MySQL connection failed: {}", e)
        })?;

        // Execute simple query to verify connection
        sqlx::query("SELECT 1")
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow::anyhow!("MySQL query failed: {}", e))?;

        conn.close().await.ok();

        Ok(CheckResult {
            status_code: None, // Databases don't have HTTP status codes
        })
    }

    fn build_postgres_connection_string(&self, endpoint: &Endpoint) -> Result<String> {
        // Parse URL to extract host and port
        let url = &endpoint.url;
        let parts: Vec<&str> = url.split("://").collect();
        
        if parts.len() != 2 {
            anyhow::bail!("Invalid PostgreSQL URL format");
        }
        
        let host_port = parts[1].trim_end_matches('/');
        
        // Build connection string
        let mut conn_str = format!("postgresql://");
        
        if let Some(username) = &endpoint.username {
            conn_str.push_str(username);
            
            if let Some(password) = &endpoint.password {
                conn_str.push(':');
                conn_str.push_str(password);
            }
            
            conn_str.push('@');
        }
        
        conn_str.push_str(host_port);
        
        if let Some(db_name) = &endpoint.database_name {
            conn_str.push('/');
            conn_str.push_str(db_name);
        }
        
        Ok(conn_str)
    }

    fn build_mysql_connection_string(&self, endpoint: &Endpoint) -> Result<String> {
        // Parse URL to extract host and port
        let url = &endpoint.url;
        let parts: Vec<&str> = url.split("://").collect();
        
        if parts.len() != 2 {
            anyhow::bail!("Invalid MySQL URL format");
        }
        
        let host_port = parts[1].trim_end_matches('/');
        
        // Build connection string
        let mut conn_str = format!("mysql://");
        
        if let Some(username) = &endpoint.username {
            conn_str.push_str(username);
            
            if let Some(password) = &endpoint.password {
                conn_str.push(':');
                conn_str.push_str(password);
            }
            
            conn_str.push('@');
        }
        
        conn_str.push_str(host_port);
        
        if let Some(db_name) = &endpoint.database_name {
            conn_str.push('/');
            conn_str.push_str(db_name);
        }
        
        Ok(conn_str)
    }
}

struct CheckResult {
    status_code: Option<i32>,
}

fn categorize_error(error: &anyhow::Error) -> FailureReason {
    let error_str = error.to_string().to_lowercase();

    if error_str.contains("dns") || error_str.contains("name resolution") {
        FailureReason::DnsError
    } else if error_str.contains("connection") || error_str.contains("connect") {
        FailureReason::ConnectionError
    } else if error_str.contains("tls") || error_str.contains("ssl") || error_str.contains("certificate") {
        FailureReason::TlsError
    } else if error_str.contains("timeout") {
        FailureReason::Timeout
    } else if error_str.contains("http") {
        FailureReason::HttpError
    } else if error_str.contains("network") {
        FailureReason::NetworkError
    } else {
        FailureReason::Other
    }
}
