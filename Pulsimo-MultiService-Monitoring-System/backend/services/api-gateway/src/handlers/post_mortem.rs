use axum::{
    extract::{Path, State},
    response::Json,
};
use chrono::{DateTime, Utc};
use models::ApiResponse;
use uuid::Uuid;

use super::AppError;
use crate::state::AppState;

pub async fn generate_post_mortem(
    State(state): State<AppState>,
    Path(incident_id): Path<Uuid>,
) -> Result<Json<ApiResponse<String>>, AppError> {
    // Fetch incident details
    let incident: (
        String,          // title
        String,          // severity
        Option<String>,  // state
        Option<String>,  // root_cause
        Option<String>,  // resolution_notes
        Option<i32>,     // estimated_affected_users
        Option<i64>,     // failed_requests_count
        serde_json::Value, // contributing_factors
        serde_json::Value, // prevention_measures
        DateTime<Utc>,   // created_at
        Option<DateTime<Utc>>, // resolved_at
        Option<String>,  // endpoint_name
        Option<String>,  // endpoint_url
    ) = sqlx::query_as(
        r#"
        SELECT i.title, i.severity, i.state, i.root_cause, i.resolution_notes,
               i.estimated_affected_users, i.failed_requests_count,
               COALESCE(i.contributing_factors, '[]'::jsonb) as contributing_factors,
               COALESCE(i.prevention_measures, '[]'::jsonb) as prevention_measures,
               i.created_at, i.resolved_at,
               e.name as endpoint_name, e.url as endpoint_url
        FROM incidents i
        LEFT JOIN endpoints e ON i.endpoint_id = e.id
        WHERE i.id = $1
        "#
    )
    .bind(incident_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Incident not found"))?;

    // Fetch timeline events
    let timeline: Vec<(String, String, Option<String>, String, DateTime<Utc>)> = sqlx::query_as(
        r#"
        SELECT event_type, title, COALESCE(description, ''), COALESCE(actor, 'system'), created_at
        FROM incident_timeline
        WHERE incident_id = $1
        ORDER BY created_at ASC
        "#
    )
    .bind(incident_id)
    .fetch_all(&state.db)
    .await?;

    // Destructure incident tuple
    let (title, severity, state, root_cause, resolution_notes, 
         estimated_affected_users, failed_requests_count,
         contributing_factors, prevention_measures,
         created_at, resolved_at, endpoint_name, endpoint_url) = incident;

    // Calculate metrics
    let resolved_at = resolved_at.unwrap_or_else(|| Utc::now());
    let duration = resolved_at - created_at;
    let hours = duration.num_hours();
    let minutes = duration.num_minutes() % 60;

    let endpoint_name_str = endpoint_name.as_deref().unwrap_or("Service");
    let endpoint_url_str = endpoint_url.as_deref().unwrap_or("N/A");
    
    let mut post_mortem = format!(
        r#"# POST-MORTEM: Incident #{}
Generated: {}

## SUMMARY
{} was {} for {} hours and {} minutes.

## INCIDENT DETAILS
- **Endpoint:** {} ({})
- **Severity:** {}
- **Status:** {}
- **Started:** {}
- **Resolved:** {}
- **Duration:** {}h {}m
"#,
        incident_id.to_string().split('-').next().unwrap_or(""),
        Utc::now().format("%Y-%m-%d %H:%M UTC"),
        endpoint_name_str,
        if state.as_ref() == Some(&"resolved".to_string()) { "unavailable" } else { "experiencing issues" },
        hours,
        minutes,
        endpoint_name_str,
        endpoint_url_str,
        severity,
        state.as_deref().unwrap_or("unknown"),
        created_at.format("%Y-%m-%d %H:%M:%S UTC"),
        resolved_at.format("%Y-%m-%d %H:%M:%S UTC"),
        hours,
        minutes
    );

    // Add timeline
    if !timeline.is_empty() {
        post_mortem.push_str("\n## TIMELINE\n");
        for (event_type, event_title, _description, _actor, event_created_at) in &timeline {
            post_mortem.push_str(&format!(
                "- **{}** - {}: {}\n",
                event_created_at.format("%H:%M:%S"),
                event_type,
                event_title
            ));
        }
    }

    // Add root cause if available
    if let Some(root_cause) = root_cause {
        post_mortem.push_str(&format!("\n## ROOT CAUSE\n{}\n", root_cause));
    }

    // Add impact metrics
    post_mortem.push_str("\n## IMPACT\n");
    post_mortem.push_str(&format!("- **Downtime:** {}h {}m\n", hours, minutes));
    
    if let Some(affected_users) = estimated_affected_users {
        post_mortem.push_str(&format!("- **Affected users:** ~{}\n", affected_users));
    }
    
    if let Some(failed_requests) = failed_requests_count {
        post_mortem.push_str(&format!("- **Failed requests:** ~{}\n", failed_requests));
    }

    // Add contributing factors if available
    if let Some(arr) = contributing_factors.as_array() {
        if !arr.is_empty() {
            post_mortem.push_str("\n## CONTRIBUTING FACTORS\n");
            for factor in arr {
                if let Some(text) = factor.as_str() {
                    post_mortem.push_str(&format!("- {}\n", text));
                }
            }
        }
    }

    // Add resolution if available
    if let Some(resolution) = resolution_notes {
        post_mortem.push_str(&format!("\n## RESOLUTION\n{}\n", resolution));
    }

    // Add prevention measures if available
    if let Some(arr) = prevention_measures.as_array() {
        if !arr.is_empty() {
            post_mortem.push_str("\n## PREVENTION MEASURES\n");
            for (i, measure) in arr.iter().enumerate() {
                if let Some(text) = measure.as_str() {
                    post_mortem.push_str(&format!("{}. {}\n", i + 1, text));
                }
            }
        }
    }

    // Add action items template
    post_mortem.push_str("\n## ACTION ITEMS\n");
    post_mortem.push_str("- [ ] Review incident response process\n");
    post_mortem.push_str("- [ ] Update monitoring and alerting\n");
    post_mortem.push_str("- [ ] Document learnings\n");
    post_mortem.push_str("- [ ] Schedule follow-up review\n");

    // Add metadata footer
    post_mortem.push_str("\n---\n");
    post_mortem.push_str(&format!("*Generated automatically by Pulsimo Monitoring System*\n"));

    Ok(Json(ApiResponse::success(post_mortem)))
}
