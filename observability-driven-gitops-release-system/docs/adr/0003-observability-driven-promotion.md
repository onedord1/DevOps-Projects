# ADR-0003: Observability-driven promotion & rollback

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

Progressive delivery (ADR-0002) gives us traffic steps, but something must **decide** whether to advance. Two common gating strategies exist: **time-based** ("wait 10 minutes, then promote") and **metric-based** ("promote only if SLOs hold"). Time-based gating still promotes unhealthy releases — it just delays the blast radius. Acme's failures were exactly releases that looked fine briefly, then degraded.

## Decision

Promotion between canary steps is **gated on Prometheus-backed SLO analysis**, not on elapsed time. Each step runs reusable `AnalysisTemplate`s that query live telemetry; the rollout advances only if all SLOs pass, and **aborts and rolls back automatically** if any SLO fails. On rollback, the platform creates an incident (via Alertmanager) and annotates Grafana dashboards.

The initial SLO set, parameterized per service:

- HTTP success rate
- HTTP 5xx error rate
- P95 latency
- Container restart count
- CPU utilization
- Memory utilization
- Payment success rate (business SLO)
- Checkout success rate (business SLO)

## Consequences

### Positive
- Releases are validated against **production reality**, not CI assumptions.
- Rollback is automatic and fast, protecting customers and the error budget.
- Decisions are auditable: the `AnalysisRun` records exactly which query failed.

### Negative / trade-offs
- Requires trustworthy, low-cardinality metrics and well-tuned thresholds.
- Bad thresholds cause false promotions or false rollbacks; thresholds need ownership and iteration.
- Adds a hard dependency on Prometheus availability during rollouts.

### Follow-ups
- Phase 5 stands up Prometheus and the metric pipeline.
- Phase 7 implements the AnalysisTemplates and abort wiring.
- Phase 9 formalizes SLO targets, error budgets, and incident automation.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Time-based promotion | Promotes unhealthy releases after a delay; does not solve Acme's problem. |
| Manual approval gates | Slow, human-dependent, doesn't scale to dozens of releases/day. |
| Post-deploy alerting only | Detects damage after 100% rollout — too late. |
