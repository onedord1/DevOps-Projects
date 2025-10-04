package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/incident-service/model"
	"github.com/your-org/monitoring-dashboard/internal/incident-service/repository"
)

// IncidentService defines the business logic operations for incidents.
type IncidentService interface {
	CreateIncident(ctx context.Context, incident *model.Incident) error
	GetIncidentByID(ctx context.Context, id uuid.UUID) (*model.Incident, error)
	GetAllIncidents(ctx context.Context, status string) ([]*model.Incident, error)
	UpdateIncident(ctx context.Context, incident *model.Incident) error
	ResolveIncident(ctx context.Context, id uuid.UUID) error
	GetTimeline(ctx context.Context, incidentID uuid.UUID) ([]*model.IncidentEvent, error)
	AddComment(ctx context.Context, incidentID uuid.UUID, userID uuid.UUID, text string) error
}

type incidentService struct {
	repo repository.IncidentRepository
}

func NewIncidentService(repo repository.IncidentRepository) IncidentService {
	return &incidentService{repo: repo}
}

// --- Implementations ---

func (s *incidentService) CreateIncident(ctx context.Context, incident *model.Incident) error {
	// TODO: Add business logic validation before creating
	return s.repo.CreateIncident(ctx, incident)
}

func (s *incidentService) GetIncidentByID(ctx context.Context, id uuid.UUID) (*model.Incident, error) {
	return s.repo.GetIncidentByID(ctx, id)
}

func (s *incidentService) GetAllIncidents(ctx context.Context, status string) ([]*model.Incident, error) {
	return s.repo.GetAllIncidents(ctx, status)
}

func (s *incidentService) UpdateIncident(ctx context.Context, incident *model.Incident) error {
	// TODO: Add business logic validation before updating
	return s.repo.UpdateIncident(ctx, incident)
}

func (s *incidentService) ResolveIncident(ctx context.Context, id uuid.UUID) error {
	// TODO: Implement logic to resolve an incident.
	// This might involve setting a resolved_at timestamp.
	return nil
}

func (s *incidentService) GetTimeline(ctx context.Context, incidentID uuid.UUID) ([]*model.IncidentEvent, error) {
	return s.repo.GetTimeline(ctx, incidentID)
}

func (s *incidentService) AddComment(ctx context.Context, incidentID uuid.UUID, userID uuid.UUID, text string) error {
	comment := &model.IncidentComment{
		IncidentID: incidentID,
		UserID:     userID,
		Text:       text,
	}
	return s.repo.AddComment(ctx, comment)
}
