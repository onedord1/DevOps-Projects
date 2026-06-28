# ADR-0014: Demo & fault-injection design

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering
- **Supersedes:** —
- **Superseded by:** —

## Context

The platform's core value proposition — automatic rollback on SLO breach — is only convincing if you can **see it happen**. Phase 10 must provide reproducible, observable fault scenarios that drive every layer of the platform (Rollouts → AnalysisTemplates → Prometheus → incident → Grafana) through a complete failure-and-recovery cycle. The demo must run on the same local k3s cluster without external dependencies.

## Decision

- **Fault injection via env vars** (`FAIL_RATE`, `LATENCY_MS` in `pkg/faults`): no sidecar/service-mesh needed; the services themselves implement controlled failure modes. This keeps demos isolated to one environment and fully reversible with `reset-demo.sh`.
- **Four canonical scenarios** (payment failure, high latency, crash-loop, healthy canary) cover every AnalysisTemplate type and both rollback triggers (business SLO + technical SLO).
- **`demo-full.sh`** is an interactive, banner-guided script that any operator can run. `SKIP_WAIT=1` makes it non-interactive for screen-recording or CI screenshot generation.
- **`load-gen.sh`** is a minimal curl loop — no external load-test framework needed; generates enough traffic to feed the Prometheus SLIs within the 2-minute analysis window.
- **`reset-demo.sh`** restores known good state between runs; demoing twice in a row always works.
- **`port-forwards.sh`** opens all five platform UIs in one command, removing "where is this?" friction during live demos.
- A **screenshots checklist** (11 sections, 30+ items) documents every visual proof-point for portfolio/interview use.
- A **troubleshooting runbook** covers all seven platform layers with diagnosis commands and fixes.

## Consequences

### Positive
- Any engineer can reproduce the full demo from scratch (no cloud credentials, no external SaaS).
- Fault injection is transparent and reversible — no risk of leaving the cluster in a degraded state.
- The demos serve as integration tests: if they pass, every phase is wired correctly.

### Negative / trade-offs
- Load is minimal (curl loop); large-scale performance characteristics are not demonstrated.
- Fault injection is per-process (not network-level); chaos-engineering tools (Chaos Mesh, LitmusChaos) would be more realistic at scale.

### Follow-ups
- Add network-level fault injection (Chaos Mesh) as an optional extension.
- CI job that runs `demo-full.sh` with `SKIP_WAIT=1` and captures Prometheus metric snapshots as automated regression tests.
