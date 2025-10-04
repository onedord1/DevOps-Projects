package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
)

type ConfigClient struct {
	baseURL string
}

func NewConfigClient(baseURL string) *ConfigClient {
	return &ConfigClient{baseURL: baseURL}
}

func (c *ConfigClient) GetAllMonitors(ctx context.Context) ([]*models.Monitor, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/api/v1/monitors", nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("config service returned status %d", resp.StatusCode)
	}

	var monitors []*models.Monitor
	if err := json.NewDecoder(resp.Body).Decode(&monitors); err != nil {
		return nil, err
	}
	return monitors, nil
}

// Add other methods like GetByID, Create, Update, Delete as needed
