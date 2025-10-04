package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/your-org/monitoring-dashboard/internal/metrics-service/model"
)

type MetricRepository interface {
	Store(ctx context.Context, metric *model.Metric) error
	GetRawMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time) ([]*model.Metric, error)
	GetAggregatedMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time, intervalMins int) ([]*model.MetricAggregate, error)
}

type metricRepository struct {
	db *pgxpool.Pool
}

func NewMetricRepository(db *pgxpool.Pool) MetricRepository {
	return &metricRepository{db: db}
}

func (r *metricRepository) Store(ctx context.Context, metric *model.Metric) error {
	query := `
        INSERT INTO metrics (time, monitor_id, environment, latency_ms, success, status_code, error_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
	_, err := r.db.Exec(ctx, query,
		metric.Time, metric.MonitorID, metric.Environment, metric.LatencyMs,
		metric.Success, metric.StatusCode, metric.ErrorCount,
	)
	return err
}

func (r *metricRepository) GetRawMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time) ([]*model.Metric, error) {
	query := `
        SELECT time, monitor_id, environment, latency_ms, success, status_code, error_count
        FROM metrics
        WHERE monitor_id = $1 AND time BETWEEN $2 AND $3
        ORDER BY time DESC
    `
	rows, err := r.db.Query(ctx, query, monitorID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var metrics []*model.Metric
	for rows.Next() {
		var m model.Metric
		if err := rows.Scan(
			&m.Time, &m.MonitorID, &m.Environment, &m.LatencyMs,
			&m.Success, &m.StatusCode, &m.ErrorCount,
		); err != nil {
			return nil, err
		}
		metrics = append(metrics, &m)
	}
	return metrics, nil
}

func (r *metricRepository) GetAggregatedMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time, intervalMins int) ([]*model.MetricAggregate, error) {
	// Use TimescaleDB's time_bucket and percentile_cont functions
	query := fmt.Sprintf(`
        SELECT
            time_bucket('%d minutes', time) AS interval_start,
            percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50,
            percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
            percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99,
            SUM(error_count)::float / COUNT(*) AS error_rate,
            COUNT(*) AS total_count
        FROM metrics
        WHERE monitor_id = $1 AND time BETWEEN $2 AND $3
        GROUP BY interval_start
        ORDER BY interval_start DESC
    `, intervalMins)

	rows, err := r.db.Query(ctx, query, monitorID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var aggregates []*model.MetricAggregate
	for rows.Next() {
		var ma model.MetricAggregate
		if err := rows.Scan(
			&ma.IntervalStart, &ma.P50, &ma.P95, &ma.P99,
			&ma.ErrorRate, &ma.TotalCount,
		); err != nil {
			return nil, err
		}
		ma.MonitorID = monitorID
		ma.IntervalMins = intervalMins
		aggregates = append(aggregates, &ma)
	}
	return aggregates, nil
}
