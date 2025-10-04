CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  environment TEXT NOT NULL,
  protocol TEXT NOT NULL,
  target_host TEXT NOT NULL,
  target_port INT,
  path TEXT,
  interval_seconds INT NOT NULL,
  timeout_ms INT NOT NULL,
  retries INT NOT NULL,
  validation_rules JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_monitors_environment ON monitors(environment);
CREATE INDEX idx_monitors_enabled ON monitors(enabled);
CREATE INDEX idx_monitors_tags ON monitors USING GIN(tags);