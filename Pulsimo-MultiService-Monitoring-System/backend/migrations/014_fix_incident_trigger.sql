-- Migration 014: Fix incident metrics trigger
-- Fixes bug where trigger referenced non-existent columns (detected_at, identified_at)
-- The actual table uses created_at instead

-- Drop existing buggy trigger and function
DROP TRIGGER IF EXISTS trigger_update_incident_metrics ON incidents;
DROP FUNCTION IF EXISTS update_incident_metrics();

-- Create corrected function
CREATE OR REPLACE FUNCTION update_incident_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate time to acknowledge (in seconds)
    -- Uses created_at since detected_at doesn't exist in the incidents table
    IF NEW.acknowledged_at IS NOT NULL AND (OLD.acknowledged_at IS NULL OR OLD.acknowledged_at <> NEW.acknowledged_at) THEN
        NEW.time_to_acknowledge_seconds = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.created_at));
    END IF;
    
    -- Calculate time to resolve (MTTR - Mean Time To Recovery)
    -- Uses created_at since detected_at doesn't exist in the incidents table
    IF NEW.resolved_at IS NOT NULL AND (OLD.resolved_at IS NULL OR OLD.resolved_at <> NEW.resolved_at) THEN
        NEW.time_to_resolve_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.created_at));
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with corrected function
CREATE TRIGGER trigger_update_incident_metrics
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_metrics();

-- Add comment to document the fix
COMMENT ON FUNCTION update_incident_metrics() IS 'Calculates incident metrics using created_at timestamp. Fixed from buggy migration 012 which used non-existent detected_at and identified_at columns.';
