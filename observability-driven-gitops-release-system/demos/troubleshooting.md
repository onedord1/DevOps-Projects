# Troubleshooting Guide

Quick reference for diagnosing issues with the Progressive Delivery Platform. Organized by layer — work from top to bottom.

---

## 1. Cluster & Bootstrap

| Symptom | Diagnosis | Fix |
|---|---|---|
| `make up` hangs at "waiting for node Ready" | k3s failed to start | `sudo systemctl status k3s; sudo journalctl -u k3s -e` |
| `Cannot reach API server` | kubeconfig not exported | `eval "$(make kubeconfig)"` |
| Port 6443 in use | Another API server running | `make down` first, then `make up` |
| Local registry unreachable | Docker not running or registry container stopped | `docker start acme-registry` |
| `ErrImagePull` from `localhost:5000/...` | k3s containerd mirror not configured | Confirm `/etc/rancher/k3s/registries.yaml` exists; `sudo systemctl restart k3s` |
| Envoy Gateway not Programmed | CRD not installed or servicelb IP not assigned | `kubectl describe gateway acme-gateway -n acme`; check `kubectl get svc -n envoy-gateway-system` |

```bash
# Quick cluster health
make cluster-info
kubectl get nodes
kubectl get pods -A | grep -v Running | grep -v Completed
```

---

## 2. Observability Stack

| Symptom | Diagnosis | Fix |
|---|---|---|
| Grafana shows "No data" for Acme panels | Prometheus not scraping the services | Check ServiceMonitor: `kubectl -n monitoring describe servicemonitor acme-services` |
| Prometheus target is DOWN | Service not deployed / port mismatch | `kubectl -n acme get svc -l app.kubernetes.io/part-of=acme-platform` |
| Loki logs missing | Alloy not running | `kubectl -n monitoring get daemonset alloy; kubectl -n monitoring logs daemonset/alloy` |
| OTel traces not appearing | Endpoint not set or collector crashlooping | `kubectl -n monitoring logs deploy/otel-collector`; check `OTEL_EXPORTER_OTLP_ENDPOINT` |
| Alertmanager not routing | Webhook receiver URL wrong | `kubectl -n monitoring exec deploy/kube-prometheus-stack-alertmanager -- wget -qO- http://localhost:9093/api/v2/receivers` |

```bash
# Verify Prometheus targets
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090 &
open http://localhost:9090/targets  # look for acme/* targets

# Query a known metric
curl -sg 'http://localhost:9090/api/v1/query?query=up{namespace="acme"}' | python3 -m json.tool
```

---

## 3. GitOps (Argo CD)

| Symptom | Diagnosis | Fix |
|---|---|---|
| Application stuck `OutOfSync` | Git repo not reachable or wrong path | Check Argo CD UI; verify `repoURL` and `targetRevision` in `gitops/apps/` |
| `ComparisonError` on CRDs | Prometheus Operator CRDs not yet established when rules synced | Trigger a manual sync after wave -20 completes; the sync-wave ordering normally prevents this |
| App stuck `Progressing` indefinitely | Rollout not becoming Healthy | Check the Rollout status and AnalysisRun (see §4) |
| Wrong image deployed | Overlay `newTag` not bumped | Verify `gitops/acme/overlays/dev/kustomization.yaml`; run `kubectl kustomize gitops/acme/overlays/dev | grep image` |

```bash
# Argo CD UI
kubectl -n argocd port-forward svc/argocd-server 8081:80 &
# password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo

# Force sync all apps
kubectl -n argocd get app -o name | xargs -I{} kubectl -n argocd patch {} --type merge -p '{"operation":{"initiatedBy":{"automated":true},"sync":{"revision":"HEAD"}}}'
```

---

## 4. Progressive Delivery (Argo Rollouts)

| Symptom | Diagnosis | Fix |
|---|---|---|
| Rollout stays at 5% forever | Analysis failing or no traffic | Check AnalysisRun: `kubectl -n acme get analysisrun` |
| `AnalysisRun` status `Error` | Prometheus unreachable from the controller | Verify `http://kube-prometheus-stack-prometheus.monitoring.svc:9090` is reachable from `argo-rollouts` ns |
| Analysis always `Successful` despite bad canary | `rollouts_pod_template_hash` label missing | Check `kubectl -n acme get pod -L rollouts-pod-template-hash`; verify ServiceMonitor `podTargetLabels` |
| Rollout stuck `Paused` | Manual pause step (no analysis failure) | `kubectl argo rollouts promote <name> -n acme` or wait for analysis to complete |
| Plugin not loaded | Binary download failed (no egress) | Check `kubectl -n argo-rollouts logs deploy/argo-rollouts | grep plugin`; vendor the binary manually |
| Gateway API weights not changing | Plugin RBAC missing or wrong service names | `kubectl get clusterrolebinding argo-rollouts-gateway-plugin`; confirm `frontend-stable`/`frontend-canary` Services exist |

```bash
# Inspect a Rollout
kubectl -n acme describe rollout payment

# Watch AnalysisRuns live
kubectl -n acme get analysisrun -w

# Check the specific metric query that failed
kubectl -n acme get analysisrun <name> -o yaml | grep -A10 "measurements"

# Manually abort a stuck canary
kubectl argo rollouts abort payment -n acme

# Manually retry after fixing the issue
kubectl argo rollouts retry payment -n acme
```

---

## 5. Supply Chain (CI/CD)

| Symptom | Diagnosis | Fix |
|---|---|---|
| `build` stage fails | Buildah can't push to registry | Check `CI_REGISTRY` variables; confirm runner has network access |
| `scan` gate fails | Fixable HIGH/CRITICAL CVE in the image | Update the base image or add to `.trivyignore`; never suppress without review |
| `sign` fails | `SIGSTORE_ID_TOKEN` not issued | Confirm `id_tokens` block in `.gitlab-ci.yml`; GitLab 15.7+ required |
| `release` push fails | `GITOPS_PUSH_TOKEN` missing or expired | Create a new project access token with `write_repository` scope |
| Cosign verify fails | Wrong issuer/identity regexp | Update `IDENTITY_REGEXP` in `ci/scripts/verify-signature.sh` to match your project path |

```bash
# Verify a signed image locally
IMAGE=registry.gitlab.com/<group>/platform/payment@sha256:<digest>
IMAGE=$IMAGE OIDC_ISSUER=https://gitlab.com \
IDENTITY_REGEXP='https://gitlab.com/<group>/.+' \
bash ci/scripts/verify-signature.sh
```

---

## 6. Incident Service

| Symptom | Diagnosis | Fix |
|---|---|---|
| Incidents not opening on rollback | Notification ConfigMap not applied or wrong svc URL | `kubectl -n argo-rollouts get cm argo-rollouts-notification-cm`; check webhook URL `http://incident.acme.svc:8080` |
| Grafana annotations missing | `grafana-token` placeholder not replaced | Update the Secret: `kubectl -n argo-rollouts edit secret argo-rollouts-notification-secret` |
| `GET /incidents` returns 404 | Incident service pod not running | `kubectl -n acme get pod -l app.kubernetes.io/name=incident` |

```bash
# Check incident service logs
kubectl -n acme logs deploy/incident --tail=30

# List open incidents (exec into the pod)
kubectl -n acme exec deploy/incident -- wget -qO- http://localhost:8080/incidents | python3 -m json.tool

# Check Argo Rollouts notification log
kubectl -n argo-rollouts logs deploy/argo-rollouts | grep -i "notification\|webhook"
```

---

## 7. SLO & Error Budget

| Symptom | Diagnosis | Fix |
|---|---|---|
| SLO burn-rate alerts firing unexpectedly | Real error rate is spiking | Check `acme:request_success_ratio:5m`; trace via Loki + Grafana |
| `slo:error_budget:ratio` always 1 | SLO rules not generating data | Confirm generated PrometheusRules are applied: `kubectl -n monitoring get prometheusrule` |
| `make deploy-report` shows no data | Prometheus not reachable on 9090 | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090` first |

```bash
# Error budget remaining for frontend availability SLO
curl -sg 'http://localhost:9090/api/v1/query?query=slo:period_error_budget_remaining:ratio{sloth_service="frontend"}' | python3 -m json.tool

# Current burn rate
curl -sg 'http://localhost:9090/api/v1/query?query=slo:current_burn_rate:ratio{sloth_service="frontend"}' | python3 -m json.tool
```

---

## Useful one-liners

```bash
# All non-Running pods
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded

# Recent events (sorted)
kubectl get events -A --sort-by=.lastTimestamp | tail -30

# Rollout status all services
for r in frontend payment order inventory; do
  echo -n "$r: "; kubectl -n acme get rollout "$r" -o jsonpath='{.status.phase}'; echo
done

# Current canary weights (frontend HTTPRoute)
kubectl -n acme get httproute frontend -o jsonpath='{.spec.rules[0].backendRefs}' | python3 -m json.tool
```
