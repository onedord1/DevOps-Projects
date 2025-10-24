-- Migration 004: Add Projects support for grouping endpoints

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code for project badge
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(20) DEFAULT 'active', -- active, archived, on_hold
    tags TEXT[], -- Array of tags
    owner_email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(org_id, slug)
);

-- Add project_id to endpoints table
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_endpoints_project_id ON endpoints(project_id);

-- Create index on org_id and status for project queries
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(org_id, status) WHERE is_active = TRUE;

-- Create project_stats view for quick statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id as project_id,
    p.org_id,
    p.name as project_name,
    COUNT(e.id) as total_endpoints,
    COUNT(CASE WHEN e.status = 'UP' THEN 1 END) as healthy_endpoints,
    COUNT(CASE WHEN e.status = 'DOWN' THEN 1 END) as down_endpoints,
    COUNT(CASE WHEN e.status = 'PARTIAL_OUTAGE' THEN 1 END) as degraded_endpoints,
    COUNT(CASE WHEN e.status = 'UNKNOWN' THEN 1 END) as unknown_endpoints,
    MAX(e.last_check_at) as last_check_at
FROM 
    projects p
    LEFT JOIN endpoints e ON p.id = e.project_id AND e.is_active = TRUE
WHERE 
    p.is_active = TRUE
GROUP BY 
    p.id, p.org_id, p.name;

-- Add updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Insert sample comment
COMMENT ON TABLE projects IS 'Projects for grouping and organizing service endpoints';
COMMENT ON COLUMN projects.priority IS 'Project priority level: low, medium, high, critical';
COMMENT ON COLUMN projects.status IS 'Project status: active, archived, on_hold';
COMMENT ON COLUMN projects.color IS 'Hex color code for visual identification';
