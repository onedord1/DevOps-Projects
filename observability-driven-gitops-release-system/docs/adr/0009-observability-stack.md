# ADR-0009: Observability stack (Prometheus, Grafana, Loki, Alloy, OTel)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

The platform's promotion/rollback decisions are **observability-driven** (ADR-0003): Argo Rollouts gates canary steps on Prometheus SLO analysis. That requires a trustworthy metrics pipeline, plus logs and traces for root-cause analysis when a rollout aborts. We need a self-hosted stack that is standard, well-maintained in 2026, and installable on both the local k3s cluster and the cloud (EKS) topology.

Decisions span four areas: **metrics + alerting + dashboards**, **logs storage**, **log collection**, and **traces**.

## Decision

- **Metrics / alerting / dashboards: `kube-prometheus-stack` (chart 87.3.0).** One chart delivers the Prometheus Operator (v0.92), Prometheus, Alertmanager, Grafana (12.7.1), node-exporter, and kube-state-metrics. The Operator's `ServiceMonitor`/`PrometheusRule` CRDs are the clean, declarative way to wire app scraping and SLO rules, and Argo Rollouts reads the same Prometheus.
- **Logs storage: Grafana Loki (chart 7.1.0)** in **single-binary + filesystem** mode locally; production switches to SimpleScalable + object storage. Loki integrates natively with Grafana alongside Prometheus.
- **Log collection: Grafana Alloy (chart 1.10.0).** Promtail reached **EOL on 2 March 2026**; Alloy is its supported successor. Alloy runs as a DaemonSet, tails `/var/log/pods`, enriches with Kubernetes metadata, and writes to Loki.
- **Traces: OpenTelemetry Collector (chart 0.159.1)** as the OTLP gateway. Services send OTLP (Phase 3 SDK) to the collector, which enriches spans with `k8sattributes` and exports them. A trace store (Grafana Tempo) is a documented drop-in; the default `debug` exporter keeps the pipeline runnable without it.

All components install into the `monitoring` namespace via pinned Helm charts (catalog in `observability/charts.env`). Prometheus discovers `ServiceMonitor`/`PrometheusRule` across all namespaces. Recording rules centralize the RED + business SLIs as `acme:*` series consumed by dashboards and AnalysisTemplates.

## Consequences

### Positive
- Batteries-included, standard stack; one source of truth for metrics that the delivery layer reuses.
- Declarative scrape/rules/dashboards (CRDs + labelled ConfigMaps) fit GitOps (Phase 6).
- Alloy keeps log collection on a supported agent; no EOL dependency.
- Metrics, logs, and traces correlate in one Grafana.

### Negative / trade-offs
- kube-prometheus-stack is resource-heavy and CRD-heavy; tuned down for laptops here.
- Local Loki/Prometheus use ephemeral/local storage — not durable; production needs PVCs/object storage.
- Without Tempo deployed, traces are only logged by the collector (visualization is opt-in).
- Metric cardinality must be watched as services grow (bounded route labels help — Phase 3).

### Follow-ups
- Phase 7: AnalysisTemplates query these metrics; add canary-vs-stable comparison queries.
- Phase 9: formal SLOs/error budgets; Alertmanager webhook → incident automation; Grafana deploy annotations.
- Production: enable Prometheus/Loki persistence and (optionally) Grafana Tempo for traces.

## Alternatives considered

| Area | Option | Why not chosen |
|---|---|---|
| Metrics | Plain Prometheus (no operator) | Loses ServiceMonitor/PrometheusRule ergonomics and bundled Grafana/Alertmanager. |
| Metrics | Grafana Mimir / Thanos | Long-term/HA storage is beyond current scope; can layer later via remote_write. |
| Logs collection | Promtail | EOL March 2026 — non-starter for a 2026 build. |
| Logs collection | Fluent Bit | Capable, but Alloy is the first-class Grafana/Loki path and also does metrics/traces. |
| Logs storage | Elasticsearch/OpenSearch | Heavier; Loki's label model and Grafana integration fit better. |
| Traces | Jaeger | Fine, but the OTel Collector + Tempo keeps us on the vendor-neutral OTLP path. |
