-- Migration 013: Add Alert Policies and Enhance Incidents
-- Creates alert_policies table and enhances existing incidents

-- ============================================
-- ALERT POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS alert_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    
    -- Severity and basic config
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Failure detection (count-based, not time-based)
    consecutive_failures_threshold INT NOT NULL DEFAULT 3,
    
    -- Response time alerting
    response_time_threshold_ms INT, -- null = disabled
    response_time_window INT DEFAULT 5, -- number of checks
    
    -- Smart alerting: Immediate warning + Confirmation
    send_warning_on_first_failure BOOLEAN DEFAULT false,
    warning_channels JSONB DEFAULT '["slack"]'::jsonb,
    
    send_alert_on_threshold BOOLEAN DEFAULT true,
    alert_channels JSONB DEFAULT '["slack", "email"]'::jsonb,
    
    -- Escalation
    escalation_enabled BOOLEAN DEFAULT false,
    escalation_delay_seconds INT DEFAULT 900, -- 15 minutes
    escalation_channels JSONB DEFAULT '["email"]'::jsonb,
    escalation_recipients JSONB DEFAULT '[]'::jsonb,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_schedule JSONB DEFAULT '[]'::jsonb,
    
    -- Alert throttling
    throttle_enabled BOOLEAN DEFAULT false,
    throttle_max_alerts INT DEFAULT 3,
    throttle_time_window_seconds INT DEFAULT 3600,
    
    -- Custom notification message templates
    warning_message_template TEXT,
    alert_message_template TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    -- Ensure one policy per endpoint
    UNIQUE(endpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_policies_endpoint ON alert_policies(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_alert_policies_enabled ON alert_policies(enabled);

-- ============================================
-- ENHANCE INCIDENTS TABLE
-- ============================================

-- Add new columns to existing incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS alert_policy_id UUID REFERENCES alert_policies(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS contributing_factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS prevention_measures JSONB DEFAULT '[]'::jsonb;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS post_mortem_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS post_mortem_completed BOOLEAN DEFAULT false;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS estimated_affected_users INT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS failed_requests_count INT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS time_to_acknowledge_seconds INT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS time_to_identify_seconds INT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS time_to_resolve_seconds INT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_incidents_alert_policy ON incidents(alert_policy_id);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);

-- ============================================
-- INCIDENT TIMELINE (extend existing incident_state_history)
-- ============================================

-- Check if incident_state_history exists, if not create incident_timeline
CREATE TABLE IF NOT EXISTS incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created',
        'status_changed',
        'acknowledged',
        'note_added',
        'escalated',
        'root_cause_found',
        'action_taken',
        'resolved',
        'reopened',
        'closed'
    )),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident ON incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_created_at ON incident_timeline(created_at);

-- ============================================
-- ALERT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    alert_policy_id UUID REFERENCES alert_policies(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'alert', 'escalation')),
    channels JSONB NOT NULL,
    message TEXT,
    sent_successfully BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_history_endpoint ON alert_history(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at);

-- ============================================
-- ALERT POLICY PRESETS
-- ============================================

CREATE TABLE IF NOT EXISTS alert_policy_presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_system BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default presets (with ON CONFLICT to avoid duplicates)
INSERT INTO alert_policy_presets (name, severity, description, config) VALUES
(
    'Critical - Payment/Transaction Services',
    'critical',
    'For revenue-critical services. Immediate alerts with fast escalation.',
    '{
        "consecutive_failures_threshold": 1,
        "send_warning_on_first_failure": true,
        "warning_channels": ["slack"],
        "alert_channels": ["slack", "email"],
        "escalation_enabled": true,
        "escalation_delay_seconds": 300,
        "response_time_threshold_ms": 2000
    }'::jsonb
),
(
    'High - Customer-Facing Services',
    'high',
    'For important customer-facing services. Alert after brief confirmation.',
    '{
        "consecutive_failures_threshold": 2,
        "send_warning_on_first_failure": true,
        "warning_channels": ["slack"],
        "alert_channels": ["slack", "email"],
        "escalation_enabled": true,
        "escalation_delay_seconds": 900,
        "response_time_threshold_ms": 5000
    }'::jsonb
),
(
    'Medium - Internal Services',
    'medium',
    'For internal tools and services. Balanced alerting.',
    '{
        "consecutive_failures_threshold": 3,
        "send_warning_on_first_failure": false,
        "alert_channels": ["slack"],
        "escalation_enabled": false,
        "response_time_threshold_ms": 10000
    }'::jsonb
),
(
    'Low - Non-Critical Services',
    'low',
    'For development and non-critical services. Minimal alerts.',
    '{
        "consecutive_failures_threshold": 5,
        "send_warning_on_first_failure": false,
        "alert_channels": ["email"],
        "escalation_enabled": false,
        "throttle_enabled": true
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate incident metrics
CREATE OR REPLACE FUNCTION calculate_incident_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate time to acknowledge
    IF NEW.acknowledged_at IS NOT NULL AND (OLD.acknowledged_at IS NULL OR OLD.acknowledged_at != NEW.acknowledged_at) THEN
        NEW.time_to_acknowledge_seconds = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.created_at));
    END IF;
    
    -- Calculate time to identify (when investigating started)
    IF NEW.investigating_started_at IS NOT NULL AND (OLD.investigating_started_at IS NULL OR OLD.investigating_started_at != NEW.investigating_started_at) THEN
        NEW.time_to_identify_seconds = EXTRACT(EPOCH FROM (NEW.investigating_started_at - NEW.created_at));
    END IF;
    
    -- Calculate time to resolve (MTTR)
    IF NEW.resolved_at IS NOT NULL AND (OLD.resolved_at IS NULL OR OLD.resolved_at != NEW.resolved_at) THEN
        NEW.time_to_resolve_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at));
    END IF;
    
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS trigger_calculate_incident_metrics ON incidents;
CREATE TRIGGER trigger_calculate_incident_metrics
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION calculate_incident_metrics();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE alert_policies IS 'Flexible alert policies per endpoint with smart alerting and count-based thresholds';
COMMENT ON TABLE incident_timeline IS 'Audit trail of all incident events';
COMMENT ON TABLE alert_history IS 'History of all alerts sent for throttling and auditing';
COMMENT ON TABLE alert_policy_presets IS 'Pre-configured alert policy templates based on service criticality';

COMMENT ON COLUMN alert_policies.consecutive_failures_threshold IS 'Number of consecutive failures before alerting (count-based, not time-based)';
COMMENT ON COLUMN alert_policies.send_warning_on_first_failure IS 'Smart alerting: Send warning on first failure, full alert on threshold';
COMMENT ON COLUMN incidents.time_to_resolve_seconds IS 'MTTR - Mean Time To Recovery in seconds';
