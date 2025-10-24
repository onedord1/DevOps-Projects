-- Migration: Create default "Uncategorized Endpoints" project
-- This project serves as the default container for endpoints not assigned to any specific project

-- Create a fixed UUID for the default project (deterministic)
-- Using a well-known UUID: '00000000-0000-0000-0000-000000000001'

INSERT INTO projects (
    id,
    org_id,
    name,
    slug,
    description,
    color,
    priority,
    status,
    tags,
    owner_email,
    is_active,
    created_at,
    updated_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    o.id,
    'Uncategorized Endpoints',
    'uncategorized-endpoints',
    'Default project for endpoints not assigned to any specific project',
    '#6B7280',
    'medium',
    'active',
    ARRAY['default', 'system']::text[],
    'system@default.local',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- Update any existing endpoints without a project_id to use the default project
UPDATE endpoints
SET project_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE project_id IS NULL
AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
    AND org_id = endpoints.org_id
);
