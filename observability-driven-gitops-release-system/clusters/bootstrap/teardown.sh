#!/usr/bin/env bash
#
# teardown.sh — destroy the local platform.
# Removes the k3s cluster, the local registry, and the repo-local kubeconfig.
# This is destructive; it prompts unless ASSUME_YES=1.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

KEEP_REGISTRY="${KEEP_REGISTRY:-0}"

uninstall_k3s() {
  if [[ -x /usr/local/bin/k3s-uninstall.sh ]]; then
    log_info "uninstalling k3s (sudo)"
    sudo /usr/local/bin/k3s-uninstall.sh
    log_ok "k3s removed"
  else
    log_warn "k3s-uninstall.sh not found — k3s may not be installed"
  fi
}

remove_registry() {
  if [[ "${KEEP_REGISTRY}" == "1" ]]; then
    log_info "KEEP_REGISTRY=1 — leaving registry '${REGISTRY_NAME}' running"
    return 0
  fi
  if docker inspect "${REGISTRY_NAME}" >/dev/null 2>&1; then
    log_info "removing registry container + data volume '${REGISTRY_NAME}'"
    docker rm -f "${REGISTRY_NAME}" >/dev/null
    docker volume rm "${REGISTRY_NAME}-data" >/dev/null 2>&1 || true
    log_ok "registry removed"
  else
    log_warn "registry '${REGISTRY_NAME}' not present"
  fi
}

remove_kubeconfig() {
  if [[ -f "${KUBECONFIG_PATH}" ]]; then
    rm -f "${KUBECONFIG_PATH}"
    log_ok "removed ${KUBECONFIG_PATH}"
  fi
}

main() {
  section "Tearing down Acme platform"
  log_warn "This will DELETE the k3s cluster and all workloads on it."
  if ! confirm "Proceed with teardown?"; then
    log_info "aborted by user"
    exit 0
  fi
  uninstall_k3s
  remove_registry
  remove_kubeconfig
  log_ok "teardown complete"
}

main "$@"
