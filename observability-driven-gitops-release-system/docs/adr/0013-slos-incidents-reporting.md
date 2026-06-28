# ADR-0013: SLOs, incidents & deploy reporting (SLO-as-code, incident webhook, deploy annotations)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

Phases 1–8 delivered a self-service deployment platform: CI builds and signs an artifact, Argo Rollouts promotes it via a canary, and Prometheus analysis gates each step. What was still missing after Phase 8:

1. **SLO definitions** — the AnalysisTemplates check thresholds in isolation; the error budgets they implicitly consume are not tracked as a shared, version-controlled artifact.
2. **Incident lifecycle** — when a canary aborts (automatic rollback), the event disappears into Rollout history. There is no searchable incident record, no metric, and no way to correlate "was there an incident open at that time?" with a dashboard.
3. **Deployment timeline in dashboards** — operators can't answer "did this metric degrade after the 14:23 deploy?" without manually checking Rollout history.
4. **Deploy health reports** — SREs need a point-in-time report of SLI averages and incident counts, especially after a release window.

## Decision

### 1. SLO-as-code with Sloth (v0.16.0)

SLOs are declared in `slos/sloth/*.slo.yaml` using the **Sloth `prometheus/v1` spec** — a compact, service-oriented format that expresses an objective, an SLI query pair, and alert routing in ~20 lines. `sloth generate` expands this into a multi-window multi-burn-rate (MWMBR) `PrometheusRule` that:

- Records `slo:sli_error:ratio_rate{5m,30m,1h,2h,6h,1d,3d,30d}` per SLO.
- Records `slo:current_burn_rate:ratio` and `slo:period_burn_rate:ratio` (burn rate relative to budget).
- Fires **fast-burn page alerts** at 14.4× budget (exhausts 2% of the 30-day budget in < 1 h) using dual-window confirmation (1h + 5m).
- Fires **slow-burn ticket alerts** at 6× budget (exhausts 5% in < 6 h) using dual-window confirmation (6h + 30m).

Generated files are committed to `slos/generated/` and applied to the `monitoring` namespace via an Argo CD Application (`gitops/apps/16-slo-rules.app.yaml`, sync-wave −3).

**Why Sloth over hand-written PromQL?**

- Burn-rate math for a 30-day window requires ~8 recording rules and 4 alert conditions per SLO. Writing and maintaining this by hand for each service invites subtle errors (wrong budget factor, missing dual-window confirmation).
- Sloth makes the SLO objective the single source of truth; the PromQL is derived, not authored.
- The `sloth_id` label on every generated series enables a generic SLO dashboard without per-service customization.
- Sloth is a CNCF landscape project with a stable v1 spec; pinning `v0.16.0` gives reproducibility.

**Why not Pyrra or Grafana SLO plugin?**

- Pyrra is excellent but adds a controller + CRD; Sloth is a single CLI that fits the existing commit-and-apply GitOps flow with no new in-cluster operator.
- Grafana SLO plugin requires Grafana Enterprise or Cloud; the platform uses OSS Grafana.

### 2. Incident webhook service

`apps/services/incident` is a small Go service that:

- Accepts Alertmanager webhook payloads (`POST /alertmanager`) and opens/resolves incidents keyed by `alertname + service`.
- Accepts Argo Rollouts notification payloads (`POST /rollout`) and opens a critical incident on `aborted`, resolves it on `completed`.
- Exposes `GET /incidents` for reporting.
- Emits `incidents_total{source,severity,service}` and `incidents_open{severity}` Prometheus counters/gauges.

This closes the "rollback → incident" loop: when Prometheus detects a canary SLO breach and Argo Rollouts aborts, the webhook fires and the incident appears in dashboards, reports, and metrics within seconds — without requiring any on-call engineer to manually create a ticket.

**Why a webhook over direct paging (e.g. PagerDuty/Opsgenie)?**

- Paging-only approaches send a notification but create no queryable record in the platform. The incident service acts as a lightweight event store scoped to the platform lifecycle.
- The incident service can be extended to fan out to an external pager (PagerDuty, Slack) while retaining the local record.
- In Phase 10, fault-injection scenarios need a machine-readable incident log; the service provides this without a third-party dependency.

**Why not Alertmanager inhibition rules alone?**

- Inhibition routes alerts but doesn't store incident state or expose it as metrics.
- The `incidents_open` gauge allows alerting on "too many open incidents" as a platform health signal.

### 3. Rollout subscribe annotations as the incident timeline

Argo Rollouts v1.9.0 has built-in webhook and Grafana notification services. Rather than a sidecar or external controller, subscribe annotations on each Rollout resource wire it to the notification ConfigMap:

```yaml
notifications.argoproj.io/subscribe.on-rollout-aborted.incident: ""
notifications.argoproj.io/subscribe.on-rollout-completed.incident: ""
notifications.argoproj.io/subscribe.on-rollout-aborted.dashboard: ""
notifications.argoproj.io/subscribe.on-rollout-completed.dashboard: ""
```

- `incident` service webhook fires → incident opens (abort) or closes (complete).
- Grafana `dashboard` service fires → a deployment annotation appears on every graph, creating a visual timeline of deploys.

**Why deploy annotations close the incident timeline?**

Grafana annotations provide context that transforms a dashboard from a "what is happening now?" view to a "what changed when?" timeline. An operator investigating a spike can immediately see "deploy at 14:23" and correlate it with the metric change — without leaving Grafana to check Argo CD or git log.

### 4. Deploy reports

`slos/deploy-report.sh` queries Prometheus (`/api/v1/query`) for the last-24h averages of the four core Acme SLIs and the incident service for open/closed incident counts, then prints a structured text report and optionally writes JSON to `reports/`. This provides a release-window summary without a Grafana dashboard open.

## Consequences

### Positive

- **Error budgets are tracked.** Burn-rate alerts fire before the 30-day budget exhausts, giving SREs early warning instead of a breach after the fact.
- **Rollback events become incidents automatically.** No manual bookkeeping; the incident metric surfaces in dashboards within seconds.
- **Deployment markers on every graph.** The Grafana annotation means every metric query has deploy context without cross-referencing systems.
- **GitOps-native.** SLO definitions, generated rules, and notification config are all in git, reviewed in MRs, and applied by Argo CD.
- **No new operators.** Sloth is a CLI (no controller); the notification service is a built-in Argo Rollouts capability.

### Negative / trade-offs

- The incident service is in-memory; incidents are lost on pod restart. Phase 10 can add a persistent backend (SQLite / PostgreSQL) if durability is required.
- Sloth-generated files are committed to git; a developer must run `make slo-generate` and commit after changing an SLO objective. CI enforcement (a check that generated files match input) is a Phase 10 hardening task.
- The `grafana-token` in the notification Secret is a placeholder; the Grafana annotation service will not function until a real SA token is substituted.
- The deploy report is point-in-time; a Grafana SLO dashboard with burn-rate graphs is more useful for ongoing monitoring (Phase 10).

### Follow-ups

- Add order + inventory SLO PrometheusRules (order-checkout-success, inventory-availability) after generating with Sloth.
- CI step: validate that `slos/generated/` matches `sloth generate` output (prevent stale rules).
- Persistent incident store (Phase 10).
- Kyverno policy: reject Rollout without notification annotations (enforce the incident loop).

## Alternatives considered

| Decision | Alternative | Why not |
|---|---|---|
| SLO-as-code | Hand-written MWMBR PromQL | Error-prone; 8+ rules per SLO; Sloth derives them from a single objective |
| SLO-as-code | Pyrra (operator + CRD) | Adds in-cluster controller; Sloth CLI fits the existing GitOps flow |
| SLO-as-code | Grafana SLO plugin | Requires Enterprise/Cloud; platform uses OSS Grafana |
| Incident store | PagerDuty / Opsgenie direct | External dependency; no local queryable record; overkill for Phase 9 |
| Incident store | Alertmanager silences | Silences suppress; they don't record incidents |
| Deploy annotations | Manual annotation script | Breaks automation; Rollouts notification is zero-touch |
| Deploy report | Grafana snapshot API | Complex to automate; shell + Prometheus query is portable and scriptable |
