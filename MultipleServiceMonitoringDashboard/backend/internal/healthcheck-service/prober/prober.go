package prober

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
)

type Result struct {
	MonitorID    uuid.UUID
	Timestamp    time.Time
	LatencyMs    *float64
	Success      bool
	StatusCode   *int
	ErrorMessage *string
}

type Prober interface {
	Probe(ctx context.Context, monitor *models.Monitor) Result
}

func NewProber(protocol string) Prober {
	switch protocol {
	case "HTTP", "HTTPS":
		return &HTTPProber{}
	case "TCP":
		return &TCPProber{}
	// TODO: Implement DNS and ICMP probers
	default:
		return &NoOpProber{}
	}
}
