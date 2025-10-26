-- Add 'googlechat' to notification_channel_type enum
ALTER TYPE notification_channel_type ADD VALUE IF NOT EXISTS 'googlechat';

-- Add new notification types for incidents and SSL certificates
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_CREATED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_ACKNOWLEDGED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_RESOLVED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'INCIDENT_ESCALATED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SSL_CERTIFICATE_EXPIRING';
