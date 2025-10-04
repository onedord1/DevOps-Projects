package prober

import (
    "context"
    "fmt"
    "net"
    "time"

    "github.com/your-org/monitoring-dashboard/internal/common/models"
)

type TCPProber struct{}

func (p *TCPProber) Probe(ctx context.Context, monitor *models.Monitor) Result {
    start := time.Now()
    address := fmt.Sprintf("%s:%d", monitor.TargetHost, *monitor.TargetPort)
    
    dialer := &net.Dialer{
        Timeout: time.Duration(monitor.TimeoutMs) * time.Millisecond,
    }

    conn, err := dialer.DialContext(ctx, "tcp", address)
    latency := time.Since(start).Seconds() * 1000

    if err != nil {
        return Result{
            MonitorID:    monitor.ID,
            Timestamp:    time.Now(),
            LatencyMs:    &latency,
            Success:      false,
            ErrorMessage: strPtr(fmt.Sprintf("tcp connection failed: %v", err)),
        }
    }
    defer conn.Close()

    return Result{
        MonitorID:    monitor.ID,
        Timestamp:    time.Now(),
        LatencyMs:    &latency,
        Success:      true,
    }
}

// NoOpProber for unimplemented protocols
type NoOpProber struct{}

func (p *NoOpProber) Probe(ctx context.Context, monitor *models.Monitor) Result {
    return Result{
        MonitorID:    monitor.ID,
        Timestamp:    time.Now(),
        Success:      false,
        ErrorMessage: strPtr(fmt.Sprintf("protocol '%s' not implemented", monitor.Protocol)),
    }
}