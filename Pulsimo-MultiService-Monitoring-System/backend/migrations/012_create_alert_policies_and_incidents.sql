-- Migration 012: Alert Policies and Incident Management
-- Creates tables for flexible alert policies and incident tracking

-- ============================================
-- ALERT POLICIES
-- ============================================

-- Create alert_policies table
CREATE TABLE IF NOT EXISTS alert_policies (
    id SERIAL PRIMARY KEY,
    endpoint_id INT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    
    -- Severity and basic config
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Failure detection (count-based, not time-based)
    consecutive_failures_threshold INT NOT NULL DEFAULT 3,
    check_interval INT NOT NULL DEFAULT 30, -- seconds
    
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
    escalation_recipients JSONB DEFAULT '[]'::jsonb, -- ["email1@example.com", "email2@example.com"]
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_schedule JSONB DEFAULT '[]'::jsonb,
    -- Format: [{"days": ["sunday"], "start": "02:00", "end": "04:00", "timezone": "UTC", "reason": "Maintenance"}]
    
    -- Alert throttling
    throttle_enabled BOOLEAN DEFAULT false,
    throttle_max_alerts INT DEFAULT 3,
    throttle_time_window_seconds INT DEFAULT 3600, -- 1 hour
    
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

-- Create index for quick lookups
CREATE INDEX idx_alert_policies_endpoint ON alert_policies(endpoint_id);
CREATE INDEX idx_alert_policies_enabled ON alert_policies(enabled);

-- ============================================
-- INCIDENTS
-- ============================================

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    
    -- Basic info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'detected' CHECK (status IN (
        'detected',      -- Auto-created from alert
        'acknowledged',  -- Someone is aware
        'investigating', -- Actively working on it
        'identified',    -- Root cause found
        'fixing',        -- Applying fix
        'monitoring',    -- Fix applied, monitoring
        'resolved',      -- Issue resolved
        'closed'         -- Post-mortem complete
    )),
    
    -- Severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    
    -- Association
    endpoint_id INT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    alert_policy_id INT REFERENCES alert_policies(id) ON DELETE SET NULL,
    
    -- Timing
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    identified_at TIMESTAMP, -- When root cause identified
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- People
    detected_by VARCHAR(255) DEFAULT 'system', -- 'system' for auto-detection
    acknowledged_by VARCHAR(255),
    resolved_by VARCHAR(255),
    
    -- Impact tracking
    affected_services JSONB DEFAULT '[]'::jsonb, -- ["service1", "service2"]
    estimated_affected_users INT,
    failed_requests_count INT,
    
    -- Root cause analysis
    root_cause TEXT,
    contributing_factors JSONB DEFAULT '[]'::jsonb,
    prevention_measures JSONB DEFAULT '[]'::jsonb,
    
    -- Categorization
    category VARCHAR(100), -- 'infrastructure', 'application', 'network', etc.
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Post-mortem
    post_mortem_url TEXT,
    post_mortem_completed BOOLEAN DEFAULT false,
    
    -- Metrics (calculated)
    time_to_acknowledge_seconds INT, -- detected -> acknowledged
    time_to_identify_seconds INT,    -- detected -> identified
    time_to_resolve_seconds INT,     -- detected -> resolved (MTTR)
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_incidents_endpoint ON incidents(endpoint_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_detected_at ON incidents(detected_at);
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at);

-- ============================================
-- INCIDENT TIMELINE
-- ============================================

-- Create incident_timeline table (audit trail)
CREATE TABLE IF NOT EXISTS incident_timeline (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created',           -- Incident created
        'status_changed',    -- Status updated
        'acknowledged',      -- Someone acknowledged
        'note_added',        -- Note/comment added
        'escalated',         -- Escalated to next level
        'root_cause_found',  -- Root cause identified
        'action_taken',      -- Action performed
        'resolved',          -- Issue resolved
        'reopened',          -- Issue reopened
        'closed'             -- Incident closed
    )),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Who did this
    actor VARCHAR(255), -- 'system' or user email
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- When
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_incident_timeline_incident ON incident_timeline(incident_id);
CREATE INDEX idx_incident_timeline_created_at ON incident_timeline(created_at);

-- ============================================
-- ALERT HISTORY (for throttling tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    endpoint_id INT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    alert_policy_id INT REFERENCES alert_policies(id) ON DELETE SET NULL,
    incident_id INT REFERENCES incidents(id) ON DELETE SET NULL,
    
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'alert', 'escalation')),
    channels JSONB NOT NULL, -- ["slack", "email"]
    
    message TEXT,
    sent_successfully BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_alert_history_endpoint ON alert_history(endpoint_id);
CREATE INDEX idx_alert_history_created_at ON alert_history(created_at);

-- ============================================
-- SEVERITY PRESETS (for quick setup)
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

-- Insert default presets
INSERT INTO alert_policy_presets (name, severity, description, config) VALUES
(
    'Critical - Payment/Transaction Services',
    'critical',
    'For revenue-critical services. Immediate alerts with fast escalation.',
    '{
        "consecutive_failures_threshold": 1,
        "check_interval": 10,
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
        "check_interval": 10,
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
        "check_interval": 30,
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
        "check_interval": 60,
        "send_warning_on_first_failure": false,
        "alert_channels": ["email"],
        "escalation_enabled": false,
        "throttle_enabled": true
    }'::jsonb
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update incident metrics
CREATE OR REPLACE FUNCTION update_incident_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate time to acknowledge
    IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
        NEW.time_to_acknowledge_seconds = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.detected_at));
    END IF;
    
    -- Calculate time to identify
    IF NEW.identified_at IS NOT NULL AND OLD.identified_at IS NULL THEN
        NEW.time_to_identify_seconds = EXTRACT(EPOCH FROM (NEW.identified_at - NEW.detected_at));
    END IF;
    
    -- Calculate time to resolve (MTTR)
    IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
        NEW.time_to_resolve_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.detected_at));
    END IF;
    
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_incident_metrics ON incidents;
CREATE TRIGGER trigger_update_incident_metrics
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_metrics();

-- Function to auto-add timeline events on status change
CREATE OR REPLACE FUNCTION add_incident_timeline_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO incident_timeline (
            incident_id,
            event_type,
            title,
            description,
            actor
        ) VALUES (
            NEW.id,
            'status_changed',
            'Status changed to ' || NEW.status,
            'Incident status changed from ' || OLD.status || ' to ' || NEW.status,
            COALESCE(NEW.updated_by, 'system')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll need to add updated_by column to incidents table for this to work
-- For now, we'll handle timeline in application code

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE alert_policies IS 'Flexible alert policies per endpoint with smart alerting';
COMMENT ON TABLE incidents IS 'Incident tracking and management';
COMMENT ON TABLE incident_timeline IS 'Audit trail of all incident events';
COMMENT ON TABLE alert_history IS 'History of all alerts sent for throttling and auditing';
COMMENT ON TABLE alert_policy_presets IS 'Pre-configured alert policy templates';

COMMENT ON COLUMN alert_policies.consecutive_failures_threshold IS 'Number of consecutive failures before alerting (count-based, not time-based)';
COMMENT ON COLUMN alert_policies.send_warning_on_first_failure IS 'Smart alerting: Send warning on first failure, full alert on threshold';
COMMENT ON COLUMN incidents.time_to_resolve_seconds IS 'MTTR - Mean Time To Recovery in seconds';
