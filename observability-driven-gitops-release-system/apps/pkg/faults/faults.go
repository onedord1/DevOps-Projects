// Package faults provides deterministic, env-driven fault injection used to
// drive the canary-rollback demos in Phase 10. Each service reads its own
// FAIL_RATE / LATENCY_MS knobs so a "bad" image version can be simulated by
// changing environment variables rather than code.
package faults

import (
	"math/rand/v2"
	"time"

	"github.com/acme-commerce/platform/pkg/config"
)

// Injector holds the configured failure probability and added latency.
type Injector struct {
	failRate  float64       // probability in [0,1] that ShouldFail returns true
	latency   time.Duration // fixed extra latency added by Delay
	jitterPct float64       // +/- percentage jitter applied to latency
}

// FromEnv builds an Injector from FAIL_RATE (0..1), LATENCY_MS and
// LATENCY_JITTER_PCT environment variables.
func FromEnv() Injector {
	return Injector{
		failRate:  clamp(config.Float("FAIL_RATE", 0)),
		latency:   time.Duration(config.Int("LATENCY_MS", 0)) * time.Millisecond,
		jitterPct: config.Float("LATENCY_JITTER_PCT", 0),
	}
}

// ShouldFail reports whether this invocation should simulate a failure.
func (i Injector) ShouldFail() bool {
	return i.failRate > 0 && rand.Float64() < i.failRate
}

// Delay sleeps for the configured latency (with optional jitter).
func (i Injector) Delay() {
	if i.latency <= 0 {
		return
	}
	d := i.latency
	if i.jitterPct > 0 {
		j := float64(d) * (i.jitterPct / 100.0)
		d += time.Duration((rand.Float64()*2 - 1) * j)
	}
	if d > 0 {
		time.Sleep(d)
	}
}

func clamp(f float64) float64 {
	switch {
	case f < 0:
		return 0
	case f > 1:
		return 1
	default:
		return f
	}
}
