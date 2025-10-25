-- Create incidents table for tracking service failures
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    state VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'acknowledged', 'investigating', 'resolved', 'closed')),
    assigned_to VARCHAR(255),
    
    -- Timestamps for lifecycle tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    investigating_started_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution details
    resolution_notes TEXT,
    
    -- First and last failure timestamps
    first_failure_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_failure_at TIMESTAMP WITH TIME ZONE NOT NULL,
    failure_count INTEGER DEFAULT 1,
    
    -- Metadata for flexible storage
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create incident state history table for audit trail
CREATE TABLE incident_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_incidents_endpoint ON incidents(endpoint_id);
CREATE INDEX idx_incidents_state ON incidents(state);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_endpoint_state ON incidents(endpoint_id, state);

CREATE INDEX idx_incident_state_history_incident ON incident_state_history(incident_id);
CREATE INDEX idx_incident_state_history_changed_at ON incident_state_history(changed_at);

-- Add comments for documentation
COMMENT ON TABLE incidents IS 'Tracks service failure incidents with lifecycle management';
COMMENT ON TABLE incident_state_history IS 'Audit trail for incident state transitions';

COMMENT ON COLUMN incidents.severity IS 'Incident severity: critical, high, medium, low';
COMMENT ON COLUMN incidents.state IS 'Incident lifecycle state: open, acknowledged, investigating, resolved, closed';
COMMENT ON COLUMN incidents.failure_count IS 'Number of consecutive failures that triggered/extended this incident';
COMMENT ON COLUMN incidents.metadata IS 'Flexible JSONB storage for additional incident context';
