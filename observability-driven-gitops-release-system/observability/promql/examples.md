# Example PromQL library

A reference of the queries the platform relies on, grouped by purpose. The
`acme:*` series are produced by the recording rules in
[`prometheus/rules/acme-recording.rules.yaml`](../prometheus/rules/acme-recording.rules.yaml);
prefer them over raw expressions in dashboards and AnalysisTemplates.

## RED metrics (per service)

```promql
# Request rate (req/s)
sum by (service) (rate(http_requests_total[5m]))

# 5xx error rate (req/s)
sum by (service) (rate(http_requests_total{code=~"5.."}[5m]))

# Success ratio (0..1)
1 - (
  sum by (service) (rate(http_requests_total{code=~"5.."}[5m]))
  / clamp_min(sum by (service) (rate(http_requests_total[5m])), 1e-9)
)

# P95 latency (seconds)
histogram_quantile(0.95,
  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))

# P99 latency (seconds)
histogram_quantile(0.99,
  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
```

## Business SLOs

```promql
# Payment success ratio
sum(rate(payments_total{result="success"}[5m]))
  / clamp_min(sum(rate(payments_total[5m])), 1e-9)

# Checkout (order) success ratio
sum(rate(orders_total{result="success"}[5m]))
  / clamp_min(sum(rate(orders_total[5m])), 1e-9)
```

## Canary comparison (Phase 7 — Argo Rollouts AnalysisTemplates)

During a rollout the stable and canary pods are distinguished by the
`rollouts-pod-template-hash` label. These compare the canary against its SLO:

```promql
# Canary success ratio (parameterized by $service / $hash in the template)
1 - (
  sum(rate(http_requests_total{service="$service", code=~"5..",
      rollouts_pod_template_hash="$hash"}[2m]))
  / clamp_min(sum(rate(http_requests_total{service="$service",
      rollouts_pod_template_hash="$hash"}[2m])), 1e-9)
)

# Canary P95 latency
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{
    service="$service", rollouts_pod_template_hash="$hash"}[2m])))
```

## Resource & stability (from kube-state-metrics / node-exporter / cAdvisor)

```promql
# Container restarts in the last hour (per pod)
increase(kube_pod_container_status_restarts_total{namespace="acme"}[1h])

# CPU utilization (cores) per pod
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="acme"}[5m]))

# Memory working set (bytes) per pod
sum by (pod) (container_memory_working_set_bytes{namespace="acme"})

# Pods not Ready
kube_pod_status_ready{namespace="acme", condition="true"} == 0
```

## Error budget

```promql
# 30-day availability (success ratio over the window)
1 - (
  sum(increase(http_requests_total{service="frontend", code=~"5.."}[30d]))
  / clamp_min(sum(increase(http_requests_total{service="frontend"}[30d])), 1)
)

# Remaining error budget for a 99.9% SLO (fraction of budget left)
1 - (
  (1 - (
     sum(increase(http_requests_total{service="frontend", code=~"5.."}[30d]))
     / clamp_min(sum(increase(http_requests_total{service="frontend"}[30d])), 1)
  )) / (1 - 0.999)
)
```
