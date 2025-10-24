use anyhow::Result;
use chrono::Utc;
use models::{CheckStatus, Endpoint, FailureReason, HealthCheckResult};
use reqwest::Client;
use std::time::{Duration, Instant};
use uuid::Uuid;

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

        let result = tokio::time::timeout(timeout, self.perform_check(endpoint)).await;

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

    async fn perform_check(&self, endpoint: &Endpoint) -> Result<CheckResult> {
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
