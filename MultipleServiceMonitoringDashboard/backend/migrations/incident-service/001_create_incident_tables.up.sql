-- incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  related_alert_ids UUID[] DEFAULT '{}'
);

-- incident_events table (for a timeline)
CREATE TABLE incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL, -- 'alert.triggered', 'alert.resolved', 'comment.added', 'status.changed'
  payload JSONB NOT NULL
);

-- incident_comments table
CREATE TABLE incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- This would link to the User Service
  timestamp TIMESTAMPTZ DEFAULT now(),
  text TEXT NOT NULL
);

-- postmortems table
CREATE TABLE postmortems (
  incident_id UUID PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
  author_user_id UUID,
  content_markdown TEXT,
  metrics_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_incident_events_incident_id_timestamp ON incident_events(incident_id, timestamp DESC);
CREATE INDEX idx_incident_comments_incident_id ON incident_comments(incident_id);