package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
	"github.com/your-org/monitoring-dashboard/internal/configuration-service/repository"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type MonitorService interface {
	CreateMonitor(ctx context.Context, monitor *models.Monitor) error
	GetMonitor(ctx context.Context, id uuid.UUID) (*models.Monitor, error)
	GetAllMonitors(ctx context.Context, filter map[string]interface{}) ([]*models.Monitor, error)
	UpdateMonitor(ctx context.Context, monitor *models.Monitor) error
	DeleteMonitor(ctx context.Context, id uuid.UUID) error
}

type monitorService struct {
	repo     repository.MonitorRepository
	eventBus events.EventBus
}

func NewMonitorService(repo repository.MonitorRepository, eventBus events.EventBus) MonitorService {
	return &monitorService{
		repo:     repo,
		eventBus: eventBus,
	}
}

func (s *monitorService) CreateMonitor(ctx context.Context, monitor *models.Monitor) error {
	monitor.ID = uuid.New()
	monitor.CreatedAt = time.Now()
	monitor.UpdatedAt = time.Now()

	if err := s.repo.Create(ctx, monitor); err != nil {
		return err
	}

	// Publish event
	event := map[string]interface{}{
		"type":    "monitor.created",
		"payload": monitor,
	}
	return s.eventBus.Publish("config.changed", event)
}

func (s *monitorService) GetMonitor(ctx context.Context, id uuid.UUID) (*models.Monitor, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *monitorService) GetAllMonitors(ctx context.Context, filter map[string]interface{}) ([]*models.Monitor, error) {
	return s.repo.GetAll(ctx, filter)
}

func (s *monitorService) UpdateMonitor(ctx context.Context, monitor *models.Monitor) error {
	monitor.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, monitor); err != nil {
		return err
	}

	// Publish event
	event := map[string]interface{}{
		"type":    "monitor.updated",
		"payload": monitor,
	}
	return s.eventBus.Publish("config.changed", event)
}

func (s *monitorService) DeleteMonitor(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}

	// Publish event
	event := map[string]interface{}{
		"type":    "monitor.deleted",
		"payload": map[string]string{"id": id.String()},
	}
	return s.eventBus.Publish("config.changed", event)
}
