-- Create notification_silences table for managing alert suppression
CREATE TABLE IF NOT EXISTS notification_silences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE CASCADE, -- NULL means all channels
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    silence_type VARCHAR(20) NOT NULL CHECK (silence_type IN ('temporary', 'permanent')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent silences
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_silences_endpoint_id ON notification_silences(endpoint_id);
CREATE INDEX idx_silences_channel_id ON notification_silences(channel_id);
CREATE INDEX idx_silences_org_id ON notification_silences(org_id);
CREATE INDEX idx_silences_active_expires ON notification_silences(is_active, expires_at) 
    WHERE is_active = true;

-- Index for checking if an endpoint is silenced
CREATE INDEX idx_silences_endpoint_active ON notification_silences(endpoint_id, is_active, expires_at)
    WHERE is_active = true;

-- Composite index for quick silence lookups
CREATE INDEX idx_silences_endpoint_channel_active ON notification_silences(endpoint_id, channel_id, is_active)
    WHERE is_active = true;

-- Function to automatically deactivate expired silences
CREATE OR REPLACE FUNCTION deactivate_expired_silences()
RETURNS void AS $$
BEGIN
    UPDATE notification_silences
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
      AND silence_type = 'temporary'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_silence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_silence_timestamp
    BEFORE UPDATE ON notification_silences
    FOR EACH ROW
    EXECUTE FUNCTION update_silence_updated_at();

-- Add comments for documentation
COMMENT ON TABLE notification_silences IS 'Stores notification silence/suppression rules for endpoints';
COMMENT ON COLUMN notification_silences.channel_id IS 'NULL means silence applies to all channels';
COMMENT ON COLUMN notification_silences.silence_type IS 'temporary (with expires_at) or permanent (until manually unmuted)';
COMMENT ON COLUMN notification_silences.expires_at IS 'NULL for permanent silences, timestamp for temporary';
