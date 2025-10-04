package service

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/your-org/monitoring-dashboard/internal/common/models"
	"github.com/your-org/monitoring-dashboard/internal/healthcheck-service/prober"
	"github.com/your-org/monitoring-dashboard/pkg/events"
	"github.com/your-org/monitoring-dashboard/internal/healthcheck-service/repository"
)

type Scheduler struct {
	cache         *MonitorCache
	probeRepo     repository.ProbeResultRepository
	eventBus      events.EventBus
	tickers       map[uuid.UUID]*time.Ticker
	tickersMu     sync.Mutex
	proberFactory func(string) prober.Prober
}

func NewScheduler(cache *MonitorCache, repo repository.ProbeResultRepository, bus events.EventBus) *Scheduler {
	return &Scheduler{
		cache:         cache,
		probeRepo:     repo,
		eventBus:      bus,
		tickers:       make(map[uuid.UUID]*time.Ticker),
		proberFactory: prober.NewProber,
	}
}

// Start initializes the scheduler with existing monitors
func (s *Scheduler) Start() {
	monitors := s.cache.GetAll()
	for _, monitor := range monitors {
		if monitor.Enabled {
			s.scheduleMonitor(monitor)
		}
	}
}

func (s *Scheduler) HandleConfigEvent(event map[string]interface{}) {
    eventType, ok := event["type"].(string)
    if !ok {
        return
    }

    payload, ok := event["payload"].(map[string]interface{})
    if !ok {
        return
    }

    // This is a simplified example. A robust implementation would
    // have proper unmarshaling into structs.
    switch eventType {
    case "monitor.created", "monitor.updated":
        // In a real system, you would unmarshal the full monitor object from the payload
        // and update the cache. For this example, we'll assume the cache is magically updated.
        // The key takeaway is the pattern: receive event -> update state -> reschedule.
        log.Printf("Processing %s event. Rescheduling logic should be here.", eventType)
        // To make this runnable, let's just refresh all enabled monitors from the cache
        monitors := s.cache.GetAll()
        for _, monitor := range monitors {
            if monitor.Enabled {
                s.scheduleMonitor(monitor)
            }
        }
    case "monitor.deleted":
        idStr, ok := payload["id"].(string)
        if !ok {
            return
        }
        id, err := uuid.Parse(idStr)
        if err != nil {
            return
        }
        s.cache.Delete(id)
        s.unscheduleMonitor(id)
    }
}

func (s *Scheduler) scheduleMonitor(monitor *models.Monitor) {
	s.unscheduleMonitor(monitor.ID) // Ensure no duplicate tickers

	s.tickersMu.Lock()
	defer s.tickersMu.Unlock()

	interval := time.Duration(monitor.IntervalSeconds) * time.Second
	ticker := time.NewTicker(interval)
	s.tickers[monitor.ID] = ticker

	go func() {
		for range ticker.C {
			s.executeProbe(monitor)
		}
	}()
	log.Printf("Scheduled monitor %s (%s) with interval %v", monitor.Name, monitor.ID, interval)
}

func (s *Scheduler) unscheduleMonitor(id uuid.UUID) {
	s.tickersMu.Lock()
	defer s.tickersMu.Unlock()

	if ticker, ok := s.tickers[id]; ok {
		ticker.Stop()
		delete(s.tickers, id)
		log.Printf("Unscheduled monitor with ID %s", id)
	}
}

func (s *Scheduler) executeProbe(monitor *models.Monitor) {
	p := s.proberFactory(monitor.Protocol)
	result := p.Probe(context.Background(), monitor)

	// Store result
	if err := s.probeRepo.Store(context.Background(), result); err != nil {
		log.Printf("Failed to store probe result for monitor %s: %v", monitor.ID, err)
	}

	// Publish event
	if err := s.eventBus.Publish("probe.result", result); err != nil {
		log.Printf("Failed to publish probe result event for monitor %s: %v", monitor.ID, err)
	}
}
