package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
)

type MonitorRepository interface {
	Create(ctx context.Context, monitor *models.Monitor) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Monitor, error)
	GetAll(ctx context.Context, filter map[string]interface{}) ([]*models.Monitor, error)
	Update(ctx context.Context, monitor *models.Monitor) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type monitorRepository struct {
	db *pgxpool.Pool
}

func NewMonitorRepository(db *pgxpool.Pool) MonitorRepository {
	return &monitorRepository{db: db}
}

func (r *monitorRepository) Create(ctx context.Context, monitor *models.Monitor) error {
	query := `
        INSERT INTO monitors (id, name, description, environment, protocol, target_host, target_port, path, interval_seconds, timeout_ms, retries, validation_rules, enabled, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `
	_, err := r.db.Exec(ctx, query,
		monitor.ID, monitor.Name, monitor.Description, monitor.Environment,
		monitor.Protocol, monitor.TargetHost, monitor.TargetPort, monitor.Path,
		monitor.IntervalSeconds, monitor.TimeoutMs, monitor.Retries,
		monitor.ValidationRules, monitor.Enabled, monitor.Tags,
	)
	return err
}

func (r *monitorRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Monitor, error) {
	query := `
        SELECT id, name, description, environment, protocol, target_host, target_port, path, interval_seconds, timeout_ms, retries, validation_rules, enabled, tags, created_at, updated_at
        FROM monitors
        WHERE id = $1
    `
	var monitor models.Monitor
	err := r.db.QueryRow(ctx, query, id).Scan(
		&monitor.ID, &monitor.Name, &monitor.Description, &monitor.Environment,
		&monitor.Protocol, &monitor.TargetHost, &monitor.TargetPort, &monitor.Path,
		&monitor.IntervalSeconds, &monitor.TimeoutMs, &monitor.Retries,
		&monitor.ValidationRules, &monitor.Enabled, &monitor.Tags,
		&monitor.CreatedAt, &monitor.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return &monitor, nil
}

func (r *monitorRepository) GetAll(ctx context.Context, filter map[string]interface{}) ([]*models.Monitor, error) {
	// Basic implementation, can be extended with dynamic filtering
	query := `
        SELECT id, name, description, environment, protocol, target_host, target_port, path, interval_seconds, timeout_ms, retries, validation_rules, enabled, tags, created_at, updated_at
        FROM monitors
        ORDER BY created_at DESC
    `
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var monitors []*models.Monitor
	for rows.Next() {
		var monitor models.Monitor
		if err := rows.Scan(
			&monitor.ID, &monitor.Name, &monitor.Description, &monitor.Environment,
			&monitor.Protocol, &monitor.TargetHost, &monitor.TargetPort, &monitor.Path,
			&monitor.IntervalSeconds, &monitor.TimeoutMs, &monitor.Retries,
			&monitor.ValidationRules, &monitor.Enabled, &monitor.Tags,
			&monitor.CreatedAt, &monitor.UpdatedAt,
		); err != nil {
			return nil, err
		}
		monitors = append(monitors, &monitor)
	}

	return monitors, nil
}

func (r *monitorRepository) Update(ctx context.Context, monitor *models.Monitor) error {
	query := `
        UPDATE monitors
        SET name = $2, description = $3, environment = $4, protocol = $5, target_host = $6, target_port = $7, path = $8, interval_seconds = $9, timeout_ms = $10, retries = $11, validation_rules = $12, enabled = $13, tags = $14, updated_at = NOW()
        WHERE id = $1
    `
	_, err := r.db.Exec(ctx, query,
		monitor.ID, monitor.Name, monitor.Description, monitor.Environment,
		monitor.Protocol, monitor.TargetHost, monitor.TargetPort, monitor.Path,
		monitor.IntervalSeconds, monitor.TimeoutMs, monitor.Retries,
		monitor.ValidationRules, monitor.Enabled, monitor.Tags,
	)
	return err
}

func (r *monitorRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM monitors WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
