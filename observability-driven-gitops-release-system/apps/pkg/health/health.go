// Package health provides Kubernetes liveness and readiness endpoints.
//
// Liveness reflects "the process is up"; readiness reflects "the process can
// serve traffic right now" (dependencies reachable). Argo Rollouts and the
// Service rely on readiness to gate traffic during canary steps.
package health

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/acme-commerce/platform/pkg/httpx"
)

// Check is a named readiness probe (e.g. NATS connectivity).
type Check func(ctx context.Context) error

// Checker aggregates readiness checks.
type Checker struct {
	mu     sync.RWMutex
	checks map[string]Check
}

// New returns an empty Checker.
func New() *Checker {
	return &Checker{checks: make(map[string]Check)}
}

// Register adds a named readiness check.
func (c *Checker) Register(name string, check Check) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.checks[name] = check
}

// Live always reports 200 once the process is running.
func (c *Checker) Live(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Ready runs all checks; any failure yields 503 with per-check detail.
func (c *Checker) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	c.mu.RLock()
	defer c.mu.RUnlock()

	results := make(map[string]string, len(c.checks))
	healthy := true
	for name, check := range c.checks {
		if err := check(ctx); err != nil {
			results[name] = err.Error()
			healthy = false
		} else {
			results[name] = "ok"
		}
	}

	status := http.StatusOK
	if !healthy {
		status = http.StatusServiceUnavailable
	}
	httpx.WriteJSON(w, status, map[string]any{
		"status": map[bool]string{true: "ready", false: "unready"}[healthy],
		"checks": results,
	})
}
