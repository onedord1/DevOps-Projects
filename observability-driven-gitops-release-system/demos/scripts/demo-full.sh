#!/usr/bin/env bash
#
# demo-full.sh — guided end-to-end demo of the Progressive Delivery Platform.
# Walks through the complete lifecycle: cluster → GitOps → healthy canary → bad
# canary (auto-rollback) → incident created → Grafana annotated.
#
# Usage:
#   bash demos/scripts/demo-full.sh            # interactive (pause between steps)
#   SKIP_WAIT=1 bash demos/scripts/demo-full.sh  # non-interactive (CI/timed demo)
#
# Prerequisites: make up, make observability, make gitops, make rollouts,
# PUSH=1 make build-apps, kubectl argo rollouts plugin (optional but nice).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/scripts/lib/common.sh"

DEFAULT_KUBECONFIG="${ROOT}/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"
NS="${ACME_NS:-acme}"
SKIP_WAIT="${SKIP_WAIT:-0}"
LOAD_PID=""

cleanup() {
  [[ -n "${LOAD_PID}" ]] && kill "${LOAD_PID}" 2>/dev/null || true
}
trap cleanup EXIT

pause() {
  [[ "${SKIP_WAIT}" == "1" ]] && return 0
  printf '\n%s  Press ENTER to continue... %s' "${C_YELLOW}" "${C_RESET}"
  read -r
}

banner() {
  printf '\n%s╔══════════════════════════════════════════════════╗%s\n' "${C_BLUE}" "${C_RESET}"
  printf '%s║  %-48s║%s\n' "${C_BLUE}" "$1" "${C_RESET}"
  printf '%s╚══════════════════════════════════════════════════╝%s\n' "${C_BLUE}" "${C_RESET}"
}

check_prereqs() {
  section "Checking prerequisites"
  require_cmd kubectl || exit 1
  kubectl cluster-info >/dev/null 2>&1 || die "No cluster — run: make up"
  kubectl get deployment -n argocd argocd-server >/dev/null 2>&1 || \
    log_warn "Argo CD not found — run: make gitops"
  kubectl get deployment -n argo-rollouts argo-rollouts >/dev/null 2>&1 || \
    log_warn "Argo Rollouts not found — run: make rollouts"
  kubectl get rollout -n "${NS}" frontend >/dev/null 2>&1 || \
    log_warn "Acme Rollouts not deployed — run: kubectl apply -k gitops/acme/overlays/dev"
  log_ok "prerequisites OK"
}

step_cluster_health() {
  banner "STEP 1 — Cluster & platform health"
  echo ""
  log_info "Nodes:"
  kubectl get nodes -o wide
  echo ""
  log_info "Platform namespaces:"
  kubectl get ns acme argocd monitoring argo-rollouts 2>/dev/null
  echo ""
  log_info "Argo CD applications:"
  kubectl -n argocd get applications 2>/dev/null || log_warn "Argo CD not running"
  pause
}

step_start_traffic() {
  banner "STEP 2 — Start background storefront traffic"
  local gw
  gw="$(kubectl -n acme get gateway acme-gateway \
        -o jsonpath='{.status.addresses[0].value}' 2>/dev/null || echo "")"
  if [[ -z "${gw}" ]]; then
    log_warn "Gateway address not ready yet; skipping load generation"
    return 0
  fi
  log_info "Gateway: http://${gw}"
  log_info "Generating ~2 rps in background..."
  bash "${ROOT}/demos/scripts/load-gen.sh" "${gw}" &
  LOAD_PID=$!
  sleep 2
  log_ok "Traffic running (PID ${LOAD_PID})"
  pause
}

step_healthy_canary() {
  banner "STEP 3 — Healthy canary: frontend v1 → v2"
  log_info "Building + pushing frontend:v2 (same code, will pass all SLOs)"
  (cd "${ROOT}" && TAG=v2 SERVICES=frontend PUSH=1 bash scripts/build-apps.sh)
  log_info "Triggering canary via rollout promote..."
  kubectl -n "${NS}" patch rollout frontend --type=json \
    -p '[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"localhost:5000/acme/frontend:v2"}]'
  log_info "Watching canary progress (Ctrl-C to skip, it continues in background):"
  if command -v kubectl-argo-rollouts >/dev/null 2>&1; then
    timeout 180 kubectl argo rollouts get rollout frontend -n "${NS}" --watch || true
  else
    kubectl -n "${NS}" get rollout frontend -w &
    sleep 45; kill %2 2>/dev/null; wait %2 2>/dev/null; true
  fi
  pause
}

step_bad_canary() {
  banner "STEP 4 — Bad canary: payment with FAIL_RATE=1 → AUTO-ROLLBACK"
  log_warn "Shipping a payment image that declines every transaction..."
  log_info "The payment-success AnalysisTemplate will breach its SLO at the 5%% step."
  log_info "Expected: rollout ABORTS → stable version restored → incident OPENED."
  echo ""
  bash "${ROOT}/rollouts/demo.sh" bad-payment || true
  pause
}

step_verify_incident() {
  banner "STEP 5 — Verify incident was created"
  log_info "Querying the incident service..."
  local incident_svc=""
  incident_svc="$(kubectl -n "${NS}" get svc incident \
    -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")"
  if [[ -n "${incident_svc}" ]]; then
    kubectl -n "${NS}" exec deploy/incident -- wget -qO- "http://localhost:8080/incidents" 2>/dev/null | \
      python3 -m json.tool 2>/dev/null || log_warn "incident service not reachable"
  else
    log_warn "incident service not deployed yet; open incidents are logged in the payment Rollout events:"
    kubectl -n "${NS}" describe rollout payment 2>/dev/null | grep -A5 "Warning\|Abort" | head -20
  fi
  pause
}

step_grafana_annotations() {
  banner "STEP 6 — Grafana dashboard annotations"
  log_info "Port-forwarding Grafana to http://localhost:3000 ..."
  log_info "Login: admin / admin"
  log_info ""
  log_info "What to look for:"
  log_info "  Dashboard: 'Acme Platform — Service Overview'"
  log_info "  → payment success-ratio dips at the canary step"
  log_info "  → vertical 'Rollback' annotation at the abort timestamp"
  log_info "  → frontend success-ratio stays flat (healthy canary promoted)"
  log_info ""
  log_info "Starting port-forward (Ctrl-C to stop):"
  kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80 &
  local GF_PID=$!
  sleep 3
  log_ok "Grafana at http://localhost:3000 (press ENTER to stop)"
  pause
  kill "${GF_PID}" 2>/dev/null; true
}

step_slo_report() {
  banner "STEP 7 — Deployment health report"
  log_info "Generating 24h SLI snapshot..."
  PROMETHEUS_URL="${PROMETHEUS_URL:-}" \
  INCIDENT_URL="${INCIDENT_URL:-}" \
  bash "${ROOT}/slos/deploy-report.sh" 2>/dev/null || \
    log_warn "Prometheus not reachable via localhost; forward it first:
    kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090"
  pause
}

main() {
  banner "Progressive Delivery Platform — End-to-End Demo"
  log_info "Repo: ${ROOT}"
  echo ""
  check_prereqs
  step_cluster_health
  step_start_traffic
  step_healthy_canary
  step_bad_canary
  step_verify_incident
  step_grafana_annotations
  step_slo_report

  banner "Demo complete"
  log_ok "You have just witnessed:"
  echo "  1. GitOps-driven deployments (Argo CD)"
  echo "  2. A healthy canary promoted automatically through SLO analysis"
  echo "  3. A bad canary detected and rolled back AUTOMATICALLY"
  echo "  4. An incident opened by the rollback event"
  echo "  5. Grafana dashboards annotated at the exact rollback timestamp"
  echo "  6. A live SLI + error-budget report"
}

main "$@"
