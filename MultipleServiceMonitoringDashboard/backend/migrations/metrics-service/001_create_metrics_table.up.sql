-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  monitor_id UUID NOT NULL,
  environment TEXT NOT NULL,
  latency_ms DOUBLE PRECISION,
  success INT,
  status_code INT,
  error_count INT DEFAULT 0
);

SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

CREATE INDEX idx_metrics_monitor_id_time ON metrics (monitor_id, time DESC);
CREATE INDEX idx_metrics_environment_time ON metrics (environment, time DESC);