#!/usr/bin/env bash
#
# port-forwards.sh — open all platform UI port-forwards in the background.
# Prints the URLs, then waits for Ctrl-C to close them all cleanly.
#
#   bash demos/scripts/port-forwards.sh
#   DETACH=1 bash demos/scripts/port-forwards.sh  # print URLs and exit

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/scripts/lib/common.sh"

DEFAULT_KUBECONFIG="${ROOT}/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

PIDS=()

fwd() {
  local label="$1" ns="$2" svc="$3" local_port="$4" remote_port="$5"
  kubectl -n "${ns}" port-forward "svc/${svc}" "${local_port}:${remote_port}" \
    >/dev/null 2>&1 &
  PIDS+=($!)
  log_ok "$(printf '%-20s http://localhost:%s' "${label}" "${local_port}")"
}

cleanup() {
  for pid in "${PIDS[@]}"; do kill "${pid}" 2>/dev/null; done
  log_info "port-forwards closed"
}
trap cleanup EXIT INT TERM

section "Opening platform port-forwards"
fwd "Argo CD"        argocd      argocd-server                      8081 80
fwd "Grafana"        monitoring  kube-prometheus-stack-grafana       3000 80
fwd "Prometheus"     monitoring  kube-prometheus-stack-prometheus    9090 9090
fwd "Alertmanager"   monitoring  kube-prometheus-stack-alertmanager  9093 9093
fwd "Incident API"   acme        incident                            8090 8080

echo ""
log_info "Credentials:"
log_info "  Argo CD  admin / \$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d)"
log_info "  Grafana  admin / admin"
echo ""

if [[ "${DETACH:-0}" == "1" ]]; then
  log_ok "port-forwards running in background (PIDs: ${PIDS[*]})"
  exit 0
fi

log_info "Press Ctrl-C to close all port-forwards."
wait
