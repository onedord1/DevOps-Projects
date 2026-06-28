#!/usr/bin/env bash
#
# uninstall.sh — remove the observability stack. Prompts unless ASSUME_YES=1.
# Note: kube-prometheus-stack CRDs are intentionally left in place (Helm does
# not remove CRDs); delete them manually only if you are sure nothing uses them.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/charts.env"

DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

main() {
  section "Removing observability stack"
  if ! confirm "Uninstall Prometheus/Grafana/Loki/Alloy/OTel from '${MONITORING_NS}'?"; then
    log_info "aborted"
    exit 0
  fi

  kubectl delete -f "${SCRIPT_DIR}/prometheus/rules/" --ignore-not-found
  kubectl delete -f "${SCRIPT_DIR}/prometheus/servicemonitor-acme.yaml" --ignore-not-found
  kubectl delete configmap acme-overview-dashboard -n "${MONITORING_NS}" --ignore-not-found

  for release in otel-collector alloy loki kube-prometheus-stack; do
    if helm status "${release}" -n "${MONITORING_NS}" >/dev/null 2>&1; then
      log_info "uninstalling ${release}"
      helm uninstall "${release}" -n "${MONITORING_NS}"
    fi
  done

  log_ok "observability stack removed (CRDs left intact)"
}

main "$@"
