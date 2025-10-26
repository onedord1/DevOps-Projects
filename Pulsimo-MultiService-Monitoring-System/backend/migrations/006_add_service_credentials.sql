-- Migration: Add service-specific credentials for databases, websockets, and gRPC
-- This migration adds fields to support different authentication mechanisms

-- Add new columns for service-specific credentials
ALTER TABLE endpoints 
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS database_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS connection_params JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the new fields
COMMENT ON COLUMN endpoints.username IS 'Username for database authentication or basic auth';
COMMENT ON COLUMN endpoints.password IS 'Password for database authentication or basic auth';
COMMENT ON COLUMN endpoints.database_name IS 'Database name for database services';
COMMENT ON COLUMN endpoints.connection_params IS 'Additional connection parameters as JSON (e.g., SSL settings, timeouts)';

-- Update existing endpoints to have empty connection_params
UPDATE endpoints 
SET connection_params = '{}'::jsonb 
WHERE connection_params IS NULL;
