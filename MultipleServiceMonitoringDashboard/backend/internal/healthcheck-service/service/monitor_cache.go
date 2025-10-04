package service

import (
	"sync"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
)

type MonitorCache struct {
	mu       sync.RWMutex
	monitors map[uuid.UUID]*models.Monitor
}

func NewMonitorCache() *MonitorCache {
	return &MonitorCache{
		monitors: make(map[uuid.UUID]*models.Monitor),
	}
}

func (c *MonitorCache) Set(monitor *models.Monitor) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.monitors[monitor.ID] = monitor
}

func (c *MonitorCache) Get(id uuid.UUID) (*models.Monitor, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	monitor, ok := c.monitors[id]
	return monitor, ok
}

func (c *MonitorCache) GetAll() []*models.Monitor {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var monitors []*models.Monitor
	for _, monitor := range c.monitors {
		monitors = append(monitors, monitor)
	}
	return monitors
}

func (c *MonitorCache) Delete(id uuid.UUID) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.monitors, id)
}
