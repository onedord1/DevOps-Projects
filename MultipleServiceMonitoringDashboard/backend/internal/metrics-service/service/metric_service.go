package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"

	"github.com/your-org/monitoring-dashboard/internal/healthcheck-service/prober"
	"github.com/your-org/monitoring-dashboard/internal/metrics-service/model"
	"github.com/your-org/monitoring-dashboard/internal/metrics-service/repository"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type MetricService interface {
	GetRawMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time) ([]*model.Metric, error)
	GetAggregatedMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time, intervalMins int) ([]*model.MetricAggregate, error)
}

type metricService struct {
	repo repository.MetricRepository
}

func NewMetricService(repo repository.MetricRepository) MetricService {
	return &metricService{repo: repo}
}

func (s *metricService) GetRawMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time) ([]*model.Metric, error) {
	return s.repo.GetRawMetrics(ctx, monitorID, from, to)
}

func (s *metricService) GetAggregatedMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time, intervalMins int) ([]*model.MetricAggregate, error) {
	return s.repo.GetAggregatedMetrics(ctx, monitorID, from, to, intervalMins)
}

// StartEventListener subscribes to probe results and stores them
func StartEventListener(bus events.EventBus, repo repository.MetricRepository) {
	log.Println("Starting metrics event listener...")
	bus.Subscribe("probe.result", func(msg *nats.Msg) {
		var result prober.Result
		if err := json.Unmarshal(msg.Data, &result); err != nil {
			log.Printf("Failed to unmarshal probe result: %v", err)
			return
		}

		// Transform prober.Result to model.Metric
		metric := &model.Metric{
			Time:        result.Timestamp,
			MonitorID:   result.MonitorID,
			Environment: "prod", // TODO: This should come from the monitor config
			LatencyMs:   result.LatencyMs,
			Success:     0,
			StatusCode:  result.StatusCode,
			ErrorCount:  0,
		}
		if result.Success {
			metric.Success = 1
		} else {
			metric.ErrorCount = 1
		}

		// Store the metric
		if err := repo.Store(context.Background(), metric); err != nil {
			log.Printf("Failed to store metric for monitor %s: %v", result.MonitorID, err)
		}
	})
}
