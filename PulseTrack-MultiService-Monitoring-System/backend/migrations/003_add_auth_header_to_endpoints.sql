-- Add auth_header field to endpoints table for authenticated monitoring
-- This field stores the complete Authorization header value
-- Examples: "Bearer token123", "Basic base64encodedcreds", "ApiKey key123"
ALTER TABLE endpoints 
ADD COLUMN auth_header TEXT;

-- Add index for quick lookup of endpoints with authentication
CREATE INDEX idx_endpoints_auth_header ON endpoints((auth_header IS NOT NULL));

-- Add comment to document the field
COMMENT ON COLUMN endpoints.auth_header IS 'Complete Authorization header value for authenticated endpoints (e.g., "Bearer token", "Basic credentials", "ApiKey key")';
