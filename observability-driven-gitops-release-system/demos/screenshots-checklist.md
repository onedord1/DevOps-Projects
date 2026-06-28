# Screenshots Checklist

Capture these screenshots to document the platform for a portfolio / demo presentation. They prove each layer of the system is working end to end. Suggested tool: `scrot`, `gnome-screenshot`, or `ShareX`.

## Setup (once)

```bash
# Start all port-forwards
bash demos/scripts/port-forwards.sh &

# Start background traffic
GW="$(kubectl -n acme get gateway acme-gateway -o jsonpath='{.status.addresses[0].value}')"
bash demos/scripts/load-gen.sh "${GW}" &
```

---

## 1. Cluster & Platform

- [ ] **1a** — `make cluster-info` output showing all namespaces `Active` and the node `Ready`
- [ ] **1b** — `kubectl get pods -A` (no crashloops; all platform pods Running)
- [ ] **1c** — Envoy Gateway `acme-gateway` showing `Programmed: True` and an address

---

## 2. Argo CD — GitOps health

- [ ] **2a** — Argo CD UI (`http://localhost:8081`) showing **all applications green (Synced + Healthy)**
- [ ] **2b** — The `acme` Application detail view showing the app tree: Rollouts, Services, AnalysisTemplates, ConfigMaps
- [ ] **2c** — The `kube-prometheus-stack` Application showing `Synced` with its resource tree

---

## 3. Progressive Delivery — healthy canary

Run `bash rollouts/demo.sh promote frontend v2` (with traffic running), then capture:

- [ ] **3a** — `kubectl argo rollouts get rollout frontend -n acme` at the **5% step** (canary pods shown)
- [ ] **3b** — An `AnalysisRun` in `Running` state: `kubectl -n acme get analysisrun`
- [ ] **3c** — `kubectl argo rollouts get rollout frontend -n acme` at **100% (Healthy/Stable)**
- [ ] **3d** — The frontend `HTTPRoute` with weights **100/0** restored after promotion: `kubectl -n acme get httproute frontend -o yaml`

---

## 4. Progressive Delivery — automatic rollback

Run `bash rollouts/demo.sh bad-payment`, then capture:

- [ ] **4a** — Rollout at **5% canary step** with the AnalysisRun showing `Failed`
- [ ] **4b** — Rollout status `Degraded` (rollback in progress)
- [ ] **4c** — Rollout status back to `Healthy` with stable revision restored
- [ ] **4d** — AnalysisRun detail showing the `payment-success` metric that failed: `kubectl -n acme describe analysisrun <name>`

---

## 5. Grafana — Acme Platform Overview

- [ ] **5a** — Full "Acme Platform — Service Overview" dashboard with live data (all panels populated)
- [ ] **5b** — **Request rate** and **success ratio** panels during the bad-payment scenario (payment dip visible)
- [ ] **5c** — **Payment success ratio** stat panel turning RED (below 95% threshold)
- [ ] **5d** — A **Rollback annotation** (vertical marker) on the timeline at the rollback timestamp
- [ ] **5e** — A **Deploy annotation** (vertical marker) at the healthy promotion timestamp

---

## 6. Prometheus — SLO & alerts

- [ ] **6a** — Prometheus Alerts page (`http://localhost:9090/alerts`) with `PaymentSuccessSLO` or `FrontendAvailabilitySLO` firing
- [ ] **6b** — Prometheus Graph of `slo:current_burn_rate:ratio{sloth_service="payment"}` spiking during the bad-payment scenario
- [ ] **6c** — Prometheus Graph of `slo:period_error_budget_remaining:ratio` for frontend (should be near 1)
- [ ] **6d** — Prometheus Targets page showing all `acme/*` targets UP and scraped recently

---

## 7. Loki — structured logs

- [ ] **7a** — Grafana Explore → Loki → `{part_of="acme-platform"}` showing JSON structured logs from the services
- [ ] **7b** — Log query filtered to the bad-payment window: `{app="payment"} | json | line_format "{{.error}}"` (showing payment decline errors)

---

## 8. Alertmanager

- [ ] **8a** — Alertmanager UI (`http://localhost:9093`) showing active alerts (payment + SLO alerts)
- [ ] **8b** — Alert detail showing the `team: payments` label routing

---

## 9. Incident service

- [ ] **9a** — `curl http://localhost:8090/incidents | python3 -m json.tool` showing an open critical incident for `payment`
- [ ] **9b** — Incident service `/metrics` endpoint: `curl http://localhost:8090/metrics | grep incidents_total`

---

## 10. CI/CD supply chain

- [ ] **10a** — GitLab CI pipeline view showing all five stages (build/scan/sbom/sign/release) green
- [ ] **10b** — Security Dashboard (GitLab → Project → Security) showing the Trivy container scan results
- [ ] **10c** — GitLab → Project → Licenses showing the CycloneDX SBOM dependency list
- [ ] **10d** — `cosign verify` output confirming keyless signature on a production image

---

## 11. Deploy report

- [ ] **11a** — `make deploy-report` terminal output showing SLI snapshot + open incidents
- [ ] **11b** — `reports/deploy-report-<timestamp>.json` file contents

---

## Naming convention

Save files as: `screenshots/<section>-<number>-<short-description>.png`

Example: `screenshots/4b-rollout-degraded-analysisrun-failed.png`
