# ADR-0002: Progressive delivery with Argo Rollouts

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

Acme's incidents came from releases reaching 100% of traffic instantly. We need **progressive exposure** — shifting traffic in increments (5 → 20 → 50 → 100%) with automated health checks between steps and automatic rollback on failure. The native Kubernetes `Deployment` rolling update has no concept of metric-gated, weighted traffic steps or automatic abort on SLO breach.

Candidates: **Argo Rollouts**, **Flagger**, or hand-rolled scripting around Deployments.

## Decision

We will use **Argo Rollouts** as the workload controller for all Acme services, configured with a **canary** strategy and analysis-gated steps. Argo Rollouts integrates natively with Argo CD (ADR-0003 builds on this) and provides first-class `AnalysisTemplate`/`AnalysisRun` objects backed by Prometheus.

## Consequences

### Positive
- Declarative canary steps with `setWeight` + `pause` + inline analysis.
- Automatic abort/rollback on analysis failure, no custom controller code.
- Tight fit with Argo CD for a coherent Argo-based GitOps stack.
- Reusable, parameterized `AnalysisTemplate`s shared across services.

### Negative / trade-offs
- Services migrate from `Deployment` to the `Rollout` CRD.
- Requires a traffic provider (ingress/service mesh) for fine-grained weighting.
- Operators must learn Rollouts CLI/CRDs.

### Follow-ups
- Phase 7 implements the canary strategy and the full AnalysisTemplate set.
- Choose and document the traffic-routing provider during Phase 7.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Flagger | Strong tool, but we standardize on the Argo ecosystem for Argo CD synergy and a single mental model. |
| Native Deployment rolling update | No weighted steps, no metric-gated promotion, no automatic SLO-based rollback. |
| Custom scripting | Reinvents a controller; brittle and unobservable. |
