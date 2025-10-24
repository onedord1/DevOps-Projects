-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE service_type AS ENUM ('frontend', 'backend', 'microservice', 'database', 'api', 'other');
CREATE TYPE endpoint_status AS ENUM ('UP', 'PARTIAL_OUTAGE', 'DOWN', 'UNKNOWN');
CREATE TYPE check_status AS ENUM ('success', 'failure', 'timeout');
CREATE TYPE failure_reason AS ENUM (
    'TIMEOUT',
    'DNS_ERROR',
    'CONNECTION_ERROR',
    'TLS_ERROR',
    'HTTP_ERROR',
    'UNEXPECTED_STATUS_CODE',
    'RESPONSE_TIME_EXCEEDED',
    'INVALID_RESPONSE',
    'NETWORK_ERROR',
    'OTHER'
);
CREATE TYPE notification_channel_type AS ENUM ('email', 'slack', 'discord', 'msteams', 'webhook');
CREATE TYPE notification_type AS ENUM (
    'ENDPOINT_DOWN',
    'ENDPOINT_RECOVERED',
    'ENDPOINT_PARTIAL_OUTAGE',
    'ORG_MAJOR_OUTAGE'
);
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'acknowledged');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, email)
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Endpoints table
CREATE TABLE endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    service_type service_type NOT NULL,
    description TEXT,
    tags JSONB,
    owner_contact VARCHAR(255),
    check_interval_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 10,
    expected_status_code INTEGER,
    expected_response_time_ms INTEGER,
    failure_threshold_minutes INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 2,
    retry_delay_seconds INTEGER DEFAULT 5,
    status endpoint_status DEFAULT 'UNKNOWN',
    last_check_at TIMESTAMP WITH TIME ZONE,
    last_status_change_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_endpoints_org_id ON endpoints(org_id);
CREATE INDEX idx_endpoints_status ON endpoints(status);
CREATE INDEX idx_endpoints_is_active ON endpoints(is_active);
CREATE INDEX idx_endpoints_service_type ON endpoints(service_type);
CREATE INDEX idx_endpoints_tags ON endpoints USING GIN(tags);

-- Health checks table (time-series data)
CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    check_status check_status NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    failure_reason failure_reason,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_checks_endpoint_id ON health_checks(endpoint_id);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at DESC);
CREATE INDEX idx_health_checks_status ON health_checks(check_status);

-- Partition health_checks table by month for better performance
-- (Optional: TimescaleDB would be ideal here)

-- Notification channels table
CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    channel_type notification_channel_type NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_channels_org_id ON notification_channels(org_id);
CREATE INDEX idx_notification_channels_is_active ON notification_channels(is_active);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE SET NULL,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_org_id ON notifications(org_id);
CREATE INDEX idx_notifications_endpoint_id ON notifications(endpoint_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Status history table (for tracking status changes)
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    old_status endpoint_status,
    new_status endpoint_status NOT NULL,
    downtime_seconds INTEGER,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_endpoint_id ON status_history(endpoint_id);
CREATE INDEX idx_status_history_changed_at ON status_history(changed_at DESC);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_endpoints_updated_at BEFORE UPDATE ON endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_channels_updated_at BEFORE UPDATE ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some seed data for testing
INSERT INTO organizations (name, slug, contact_email) VALUES
    ('Demo Organization', 'demo-org', 'admin@demo.org');
