package prober

import (
    "context"
    "fmt"
    "net/http"
    "time"

    "github.com/your-org/monitoring-dashboard/internal/common/models"
)

type HTTPProber struct {
    client *http.Client
}

func NewHTTPProber() *HTTPProber {
    return &HTTPProber{
        client: &http.Client{
            Timeout: 10 * time.Second, // Default timeout, will be overridden by monitor config
        },
    }
}

func (p *HTTPProber) Probe(ctx context.Context, monitor *models.Monitor) Result {
    start := time.Now()
    url := fmt.Sprintf("%s://%s%s", monitor.Protocol, monitor.TargetHost, *monitor.Path)
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return Result{
            MonitorID:    monitor.ID,
            Timestamp:    time.Now(),
            Success:      false,
            ErrorMessage: strPtr(fmt.Sprintf("failed to create request: %v", err)),
        }
    }

    // Set timeout from monitor config
    p.client.Timeout = time.Duration(monitor.TimeoutMs) * time.Millisecond

    resp, err := p.client.Do(req)
    latency := time.Since(start).Seconds() * 1000 // in ms

    if err != nil {
        return Result{
            MonitorID:    monitor.ID,
            Timestamp:    time.Now(),
            LatencyMs:    &latency,
            Success:      false,
            ErrorMessage: strPtr(fmt.Sprintf("request failed: %v", err)),
        }
    }
    defer resp.Body.Close()

    // Basic validation: check if status code is 2xx
    success := resp.StatusCode >= 200 && resp.StatusCode < 300
    var errorMessage *string
    if !success {
        errorMessage = strPtr(fmt.Sprintf("unexpected status code: %d", resp.StatusCode))
    }

    return Result{
        MonitorID:    monitor.ID,
        Timestamp:    time.Now(),
        LatencyMs:    &latency,
        Success:      success,
        StatusCode:   &resp.StatusCode,
        ErrorMessage: errorMessage,
    }
}

func strPtr(s string) *string {
    return &s
}