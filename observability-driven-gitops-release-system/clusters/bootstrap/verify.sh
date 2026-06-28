#!/usr/bin/env bash
#
# verify.sh — health summary of the local platform (used by `make cluster-info`).
# Read-only: never mutates the cluster.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

if [[ ! -f "${KUBECONFIG_PATH}" ]]; then
  die "no kubeconfig at ${KUBECONFIG_PATH} — run 'make up' first"
fi
export KUBECONFIG="${KUBECONFIG_PATH}"

main() {
  section "Cluster info"
  kubectl cluster-info 2>/dev/null | head -n3 || die "cannot reach the API server"

  section "Nodes"
  kubectl get nodes -o wide

  section "Platform namespaces"
  kubectl get ns "${PLATFORM_NAMESPACES[@]}" 2>/dev/null || log_warn "some namespaces missing"

  section "Ingress controller"
  kubectl get pods -n ingress-nginx 2>/dev/null || log_warn "ingress-nginx not installed"
  kubectl get svc -n ingress-nginx 2>/dev/null || true

  section "Local registry"
  if curl -sf "http://localhost:${REGISTRY_PORT}/v2/_catalog" >/dev/null; then
    log_ok "registry reachable: http://localhost:${REGISTRY_PORT}/v2/_catalog"
    curl -s "http://localhost:${REGISTRY_PORT}/v2/_catalog"
  else
    log_warn "registry not reachable on :${REGISTRY_PORT}"
  fi

  echo
  log_ok "verification complete"
}

main "$@"
