package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/metrics-service/model"
)

type MetricsClient struct {
	baseURL string
}

func NewMetricsClient(baseURL string) *MetricsClient {
	return &MetricsClient{baseURL: baseURL}
}

func (c *MetricsClient) GetAggregatedMetrics(ctx context.Context, monitorID uuid.UUID, from, to time.Time, intervalMins int) ([]*model.MetricAggregate, error) {
	url := fmt.Sprintf("%s/api/v1/metrics/aggregate?monitor_id=%s&from=%s&to=%s&granularity=%d",
		c.baseURL, monitorID, from.Format(time.RFC3339), to.Format(time.RFC3339), intervalMins)

	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("metrics service returned status %d", resp.StatusCode)
	}

	var aggregates []*model.MetricAggregate
	if err := json.NewDecoder(resp.Body).Decode(&aggregates); err != nil {
		return nil, err
	}
	return aggregates, nil
}
