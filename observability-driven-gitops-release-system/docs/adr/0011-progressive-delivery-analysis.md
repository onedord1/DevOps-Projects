# ADR-0011: Progressive delivery — canary strategy & analysis design

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

ADR-0002 chose Argo Rollouts; ADR-0003 made promotion observability-driven; ADR-0005 chose Gateway API for traffic routing. Phase 7 implements the loop: canary steps, SLO analysis between steps, and automatic abort/rollback. Several concrete decisions remained: how traffic is split, how the canary is isolated in metrics, which SLOs gate each service, and how templates stay reusable.

## Decision

- **Canary steps 5 → 20 → 50 → 100%** with a `pause` + `analysis` between each weight increase. Failing analysis aborts the rollout; Argo Rollouts shifts all traffic back to the stable ReplicaSet automatically.
- **Traffic routing:** `frontend` (internet-facing) uses the **Gateway API plugin** (v0.15.0) to weight its `HTTPRoute` stable/canary backends. Internal services (`payment`, `order`, `inventory`) use **replica-based** canary (no router needed); analysis still gates them. `notification` stays a Deployment (event consumer, no inbound traffic to canary).
- **Canary isolation in metrics:** the ServiceMonitor copies the pod label `rollouts-pod-template-hash` into the metric label `rollouts_pod_template_hash` (`podTargetLabels`). Every AnalysisTemplate filters on `{{args.canary-hash}}` (passed from the Rollout via `valueFrom.podTemplateHashValue: Latest`), so analysis measures **only the canary pods**, not the blended service.
- **Reusable, parameterized AnalysisTemplates (8):** http-success-rate, http-5xx-rate, p95-latency, restart-count, cpu-utilization, memory-utilization, payment-success, checkout-success. Thresholds are template `args` with sane defaults; each service composes the subset it cares about.
- **Per-service SLO composition:** RED templates for all HTTP services; **payment-success** on the payment Rollout; **checkout-success** on the order Rollout; restart/CPU/memory guardrails where relevant.
- **No-data safety:** success conditions are written `len(result) == 0 || <slo>` so an empty query (no traffic yet) is non-fatal; load is generated during a demo. `count`/`failureLimit` bound flapping.
- **Prometheus source:** templates query `kube-prometheus-stack-prometheus.monitoring.svc:9090` — the same Prometheus and the same `acme:*`-style queries used by the Phase 5 dashboards.

The Rollouts and AnalysisTemplates live in the GitOps `acme` Kustomize tree (namespaced), so Argo CD manages them; Argo Rollouts + the plugin + RBAC are platform Applications (sync waves -25/-24, before the workloads).

## Consequences

### Positive
- Releases are validated against canary-only production telemetry; bad versions never reach 100%.
- One reusable template set serves every service; thresholds are per-Rollout args.
- Both routed (Gateway API) and routerless (replica-based) canary patterns are demonstrated.
- Fully GitOps-managed and reproducible.

### Negative / trade-offs
- Replica-based canary approximates traffic share by pod count — coarser than true L7 weighting (acceptable for internal services; can adopt a mesh later).
- Analysis depends on Prometheus availability and on metrics carrying the canary hash (requires the `podTargetLabels` wiring).
- Meaningful analysis needs traffic; low-traffic services rely on the no-data-safe conditions and longer windows.
- The controller downloads the plugin binary at startup (needs egress, or vendor it).

### Follow-ups
- Phase 8: CI bumps the image tag via a GitOps commit, triggering these canaries.
- Phase 9: rollback → incident creation + Grafana deploy annotations; formal error-budget gates.
- Phase 10: fault-injection scenarios (the `bad-payment` demo) and screenshots.

## Alternatives considered

| Decision | Alternative | Why not |
|---|---|---|
| Canary | Blue-green | Less granular exposure; canary + analysis matches "validate on real traffic". |
| Canary isolation | Separate canary Prometheus job per service | More moving parts than copying one pod label. |
| Internal services | Full Gateway routing for all | Needs routes/mesh for every internal call; replica-based is simpler and sufficient. |
| Thresholds | Hard-coded per service | Template args keep one reusable set with per-Rollout overrides. |
