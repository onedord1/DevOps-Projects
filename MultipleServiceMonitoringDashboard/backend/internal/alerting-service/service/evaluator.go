package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"

	"github.com/your-org/monitoring-dashboard/internal/alerting-service/model"
	"github.com/your-org/monitoring-dashboard/internal/alerting-service/repository"
	"github.com/your-org/monitoring-dashboard/internal/healthcheck-service/prober"
	"github.com/your-org/monitoring-dashboard/pkg/cache"
	"github.com/your-org/monitoring-dashboard/pkg/events"
)

type Evaluator struct {
	ruleRepo repository.AlertRepository
	cache    cache.Cache
	eventBus events.EventBus
}

func NewEvaluator(ruleRepo repository.AlertRepository, cache cache.Cache, eventBus events.EventBus) *Evaluator {
	return &Evaluator{
		ruleRepo: ruleRepo,
		cache:    cache,
		eventBus: eventBus,
	}
}

// StartEventListener subscribes to probe results and triggers evaluation
func (e *Evaluator) StartEventListener() {
	log.Println("Starting alerting event listener...")
	e.eventBus.Subscribe("probe.result", func(msg *nats.Msg) {
		var result prober.Result
		if err := json.Unmarshal(msg.Data, &result); err != nil {
			log.Printf("Failed to unmarshal probe result for alerting: %v", err)
			return
		}
		go e.Evaluate(context.Background(), result.MonitorID, result)
	})
}

// Evaluate checks a monitor's metrics against all its alert rules
func (e *Evaluator) Evaluate(ctx context.Context, monitorID uuid.UUID, result prober.Result) {
	rules, err := e.ruleRepo.GetRulesForMonitor(ctx, monitorID)
	if err != nil {
		log.Printf("Failed to get rules for monitor %s: %v", monitorID, err)
		return
	}

	for _, rule := range rules {
		go e.evaluateRule(ctx, rule, result)
	}
}

func (e *Evaluator) evaluateRule(ctx context.Context, rule *model.AlertRule, result prober.Result) {
    // 1. Check cooldown
    cooldownKey := "alert:cooldown:" + rule.ID.String()
    
    // FIX: Correctly handle the two return values from Exists
    inCooldown, err := e.cache.Exists(ctx, cooldownKey)
    if err != nil {
        log.Printf("Failed to check cooldown for rule %s: %v", rule.ID, err)
        return // If we can't check the cache, we should not proceed to avoid spamming alerts
    }
    
    if inCooldown {
        return // Still in cooldown period
    }

    // 2. Check if there's an active alert
    activeInstance, err := e.ruleRepo.GetActiveInstanceForRule(ctx, rule.ID)
    if err != nil {
        log.Printf("Failed to get active instance for rule %s: %v", rule.ID, err)
        return
    }

    // 3. Evaluate the condition
    isTriggered := e.checkCondition(rule, result)

    if isTriggered && activeInstance == nil {
        // New alert!
        log.Printf("ALERT TRIGGERED: Rule '%s' for monitor %s", rule.Name, rule.MonitorID)
        instance := &model.AlertInstance{
            ID:           uuid.New(),
            RuleID:       rule.ID,
            MonitorID:    rule.MonitorID,
            TriggeredAt:  time.Now(),
            Status:       "active",
            CurrentValue: result.LatencyMs,
            Severity:     rule.Severity,
        }
        if err := e.ruleRepo.CreateInstance(ctx, instance); err != nil {
            log.Printf("Failed to create alert instance: %v", err)
            return
        }

        // Set cooldown
        e.cache.Set(ctx, cooldownKey, "1", time.Duration(rule.CooldownSecs)*time.Second)

        // Publish event
        e.eventBus.Publish("alert.triggered", instance)

    } else if !isTriggered && activeInstance != nil {
        // Alert resolved!
        log.Printf("ALERT RESOLVED: Rule '%s' for monitor %s", rule.Name, rule.MonitorID)
        now := time.Now()
        activeInstance.ResolvedAt = &now
        activeInstance.Status = "resolved"
        activeInstance.UpdatedAt = now

        if err := e.ruleRepo.UpdateInstance(ctx, activeInstance); err != nil {
            log.Printf("Failed to update resolved alert instance: %v", err)
            return
        }

        // Publish event
        e.eventBus.Publish("alert.resolved", activeInstance)
    }
}

func (e *Evaluator) checkCondition(rule *model.AlertRule, result prober.Result) bool {
	// Simple check: if the probe failed, it's a trigger
	if !result.Success {
		return true
	}

	// Check latency threshold
	if rule.LatencyThresholdMs != nil && result.LatencyMs != nil {
		if *result.LatencyMs > *rule.LatencyThresholdMs {
			return true
		}
	}

	// In a real system, you'd also check error rate over a window here
	// by querying the Metrics Service.

	return false
}
