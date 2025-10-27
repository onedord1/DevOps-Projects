-- Migration: Create status_history table for analytics and historical data
-- This table stores every status check result for historical analysis

-- Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_status_history_endpoint_time ON status_history(endpoint_id, checked_at DESC);
CREATE INDEX idx_status_history_checked_at ON status_history(checked_at DESC);
CREATE INDEX idx_status_history_status ON status_history(status);
CREATE INDEX idx_status_history_endpoint_status ON status_history(endpoint_id, status, checked_at DESC);

-- Create function to calculate uptime percentage
CREATE OR REPLACE FUNCTION calculate_uptime(
    p_endpoint_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS NUMERIC AS $$
DECLARE
    total_checks INTEGER;
    up_checks INTEGER;
    uptime_percentage NUMERIC;
BEGIN
    -- Count total checks in the period
    SELECT COUNT(*) INTO total_checks
    FROM status_history
    WHERE endpoint_id = p_endpoint_id
        AND checked_at BETWEEN p_start_time AND p_end_time;
    
    -- If no checks, return NULL
    IF total_checks = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Count UP/HEALTHY checks
    SELECT COUNT(*) INTO up_checks
    FROM status_history
    WHERE endpoint_id = p_endpoint_id
        AND checked_at BETWEEN p_start_time AND p_end_time
        AND status IN ('UP', 'HEALTHY');
    
    -- Calculate percentage
    uptime_percentage := (up_checks::NUMERIC / total_checks::NUMERIC) * 100;
    
    RETURN ROUND(uptime_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to get downtime periods
CREATE OR REPLACE FUNCTION get_downtime_periods(
    p_endpoint_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS TABLE(
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH status_changes AS (
        SELECT 
            checked_at,
            status,
            LAG(status) OVER (ORDER BY checked_at) as prev_status,
            LAG(checked_at) OVER (ORDER BY checked_at) as prev_checked_at
        FROM status_history
        WHERE endpoint_id = p_endpoint_id
            AND checked_at BETWEEN p_start_time AND p_end_time
        ORDER BY checked_at
    ),
    downtime_starts AS (
        SELECT 
            checked_at as down_start,
            status
        FROM status_changes
        WHERE (prev_status IN ('UP', 'HEALTHY') OR prev_status IS NULL)
            AND status IN ('DOWN', 'DEGRADED', 'ERROR')
    ),
    downtime_ends AS (
        SELECT 
            checked_at as down_end,
            prev_checked_at as down_start
        FROM status_changes
        WHERE prev_status IN ('DOWN', 'DEGRADED', 'ERROR')
            AND status IN ('UP', 'HEALTHY')
    )
    SELECT 
        ds.down_start as start_time,
        COALESCE(de.down_end, NOW()) as end_time,
        EXTRACT(EPOCH FROM (COALESCE(de.down_end, NOW()) - ds.down_start))::INTEGER / 60 as duration_minutes,
        ds.status
    FROM downtime_starts ds
    LEFT JOIN downtime_ends de ON ds.down_start = de.down_start
    ORDER BY ds.down_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for automatic data cleanup (keep only 90 days of detailed data)
CREATE OR REPLACE FUNCTION cleanup_old_status_history() RETURNS void AS $$
BEGIN
    DELETE FROM status_history
    WHERE checked_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create aggregated hourly statistics table for long-term storage
CREATE TABLE IF NOT EXISTS status_history_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    hour_start TIMESTAMPTZ NOT NULL,
    total_checks INTEGER NOT NULL,
    up_checks INTEGER NOT NULL,
    down_checks INTEGER NOT NULL,
    avg_response_time_ms INTEGER,
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    uptime_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(endpoint_id, hour_start)
);

CREATE INDEX idx_status_history_hourly_endpoint_time ON status_history_hourly(endpoint_id, hour_start DESC);

-- Function to aggregate hourly statistics
CREATE OR REPLACE FUNCTION aggregate_hourly_statistics(p_hour_start TIMESTAMPTZ) RETURNS void AS $$
BEGIN
    INSERT INTO status_history_hourly (
        endpoint_id,
        hour_start,
        total_checks,
        up_checks,
        down_checks,
        avg_response_time_ms,
        min_response_time_ms,
        max_response_time_ms,
        p95_response_time_ms,
        uptime_percentage
    )
    SELECT 
        endpoint_id,
        p_hour_start as hour_start,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE status IN ('UP', 'HEALTHY')) as up_checks,
        COUNT(*) FILTER (WHERE status IN ('DOWN', 'DEGRADED', 'ERROR')) as down_checks,
        AVG(response_time_ms)::INTEGER as avg_response_time_ms,
        MIN(response_time_ms) as min_response_time_ms,
        MAX(response_time_ms) as max_response_time_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER as p95_response_time_ms,
        ROUND((COUNT(*) FILTER (WHERE status IN ('UP', 'HEALTHY'))::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as uptime_percentage
    FROM status_history
    WHERE checked_at >= p_hour_start 
        AND checked_at < p_hour_start + INTERVAL '1 hour'
    GROUP BY endpoint_id
    ON CONFLICT (endpoint_id, hour_start) DO UPDATE SET
        total_checks = EXCLUDED.total_checks,
        up_checks = EXCLUDED.up_checks,
        down_checks = EXCLUDED.down_checks,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        min_response_time_ms = EXCLUDED.min_response_time_ms,
        max_response_time_ms = EXCLUDED.max_response_time_ms,
        p95_response_time_ms = EXCLUDED.p95_response_time_ms,
        uptime_percentage = EXCLUDED.uptime_percentage;
END;
$$ LANGUAGE plpgsql;

-- Add comment to describe the table
COMMENT ON TABLE status_history IS 'Stores historical status check results for analytics. Detailed data kept for 90 days.';
COMMENT ON TABLE status_history_hourly IS 'Aggregated hourly statistics for long-term analytics. Kept indefinitely.';
COMMENT ON FUNCTION calculate_uptime IS 'Calculates uptime percentage for an endpoint within a time period';
COMMENT ON FUNCTION get_downtime_periods IS 'Returns all downtime periods for an endpoint within a time period';
COMMENT ON FUNCTION cleanup_old_status_history IS 'Deletes status history older than 90 days';
COMMENT ON FUNCTION aggregate_hourly_statistics IS 'Aggregates status history into hourly statistics';
