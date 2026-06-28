#!/usr/bin/env bash
#
# uninstall.sh — remove the GitOps control plane. Deleting the root Application
# cascades to all children (their finalizers prune managed resources). Prompts
# unless ASSUME_YES=1.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/charts.env"

DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

main() {
  section "Removing GitOps control plane"
  log_warn "This deletes the root Application, which prunes everything it manages."
  if ! confirm "Proceed?"; then
    log_info "aborted"
    exit 0
  fi

  kubectl delete -f "${SCRIPT_DIR}/bootstrap/root-app.yaml" --ignore-not-found
  log_info "waiting for child applications to finalize"
  sleep 10
  kubectl delete -f "${SCRIPT_DIR}/projects/" --ignore-not-found

  if helm status argocd -n "${ARGOCD_NS}" >/dev/null 2>&1; then
    helm uninstall argocd -n "${ARGOCD_NS}"
  fi
  log_ok "GitOps control plane removed"
}

main "$@"
