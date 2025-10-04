-- alert_rules table
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL,
  name TEXT NOT NULL,
  environment TEXT NOT NULL,
  latency_threshold_ms DOUBLE PRECISION,
  error_rate_threshold DOUBLE PRECISION,
  evaluation_window_seconds INT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  cooldown_seconds INT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- alert_instances table
CREATE TABLE alert_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id),
  monitor_id UUID NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
  current_value DOUBLE PRECISION,
  severity TEXT,
  notification_sent BOOLEAN DEFAULT FALSE,
  escalation_stage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_alert_rules_monitor_id ON alert_rules(monitor_id);
CREATE INDEX idx_alert_instances_rule_id ON alert_instances(rule_id);
CREATE INDEX idx_alert_instances_status ON alert_instances(status);