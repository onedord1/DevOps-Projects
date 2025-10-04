package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/your-org/monitoring-dashboard/internal/healthcheck-service/prober"
)

type ProbeResultRepository interface {
	Store(ctx context.Context, result prober.Result) error
}

type probeResultRepository struct {
	db *pgxpool.Pool
}

func NewProbeResultRepository(db *pgxpool.Pool) ProbeResultRepository {
	return &probeResultRepository{db: db}
}

func (r *probeResultRepository) Store(ctx context.Context, result prober.Result) error {
	query := `
        INSERT INTO probe_results (id, monitor_id, timestamp, latency_ms, success, status_code, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
	_, err := r.db.Exec(ctx, query,
		uuid.New(), result.MonitorID, result.Timestamp, result.LatencyMs,
		result.Success, result.StatusCode, result.ErrorMessage,
	)
	return err
}
