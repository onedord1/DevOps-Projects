#!/usr/bin/env bash
#
# install.sh — install the observability stack into the `monitoring` namespace:
# kube-prometheus-stack (Prometheus/Alertmanager/Grafana), Loki, Alloy, and the
# OpenTelemetry Collector, plus the Acme ServiceMonitor, rules and dashboard.
# Idempotent: re-running upgrades in place.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/charts.env"

# Use the repo-local kubeconfig from Phase 2 when present.
DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

VALUES="${SCRIPT_DIR}/values"

preflight() {
  require_cmd helm "https://helm.sh/docs/intro/install/" || exit 1
  require_cmd kubectl "https://kubernetes.io/docs/tasks/tools/" || exit 1
  if ! kubectl cluster-info >/dev/null 2>&1; then
    die "cannot reach a cluster (KUBECONFIG=${KUBECONFIG}). Run 'make up' first."
  fi
  kubectl get namespace "${MONITORING_NS}" >/dev/null 2>&1 || kubectl create namespace "${MONITORING_NS}"
}

add_repos() {
  section "Helm repositories"
  helm repo add prometheus-community "${REPO_PROM}" >/dev/null 2>&1 || true
  helm repo add grafana "${REPO_GRAFANA}" >/dev/null 2>&1 || true
  helm repo add open-telemetry "${REPO_OTEL}" >/dev/null 2>&1 || true
  helm repo update prometheus-community grafana open-telemetry >/dev/null
  log_ok "repositories ready"
}

install_kps() {
  section "kube-prometheus-stack ${KPS_VERSION}"
  helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --version "${KPS_VERSION}" \
    --namespace "${MONITORING_NS}" \
    -f "${VALUES}/kube-prometheus-stack.values.yaml" \
    --wait --timeout 10m
  log_ok "kube-prometheus-stack installed"
}

install_loki() {
  section "Loki ${LOKI_VERSION}"
  helm upgrade --install loki grafana/loki \
    --version "${LOKI_VERSION}" \
    --namespace "${MONITORING_NS}" \
    -f "${VALUES}/loki.values.yaml" \
    --wait --timeout 10m
  log_ok "Loki installed"
}

install_alloy() {
  section "Grafana Alloy ${ALLOY_VERSION}"
  helm upgrade --install alloy grafana/alloy \
    --version "${ALLOY_VERSION}" \
    --namespace "${MONITORING_NS}" \
    -f "${VALUES}/alloy.values.yaml" \
    --wait --timeout 5m
  log_ok "Alloy installed"
}

install_otel() {
  section "OpenTelemetry Collector ${OTEL_VERSION}"
  helm upgrade --install otel-collector open-telemetry/opentelemetry-collector \
    --version "${OTEL_VERSION}" \
    --namespace "${MONITORING_NS}" \
    -f "${VALUES}/otel-collector.values.yaml" \
    --wait --timeout 5m
  log_ok "OpenTelemetry Collector installed"
}

apply_acme_observability() {
  section "Acme ServiceMonitor, rules and dashboard"
  kubectl apply -f "${SCRIPT_DIR}/prometheus/servicemonitor-acme.yaml"
  kubectl apply -f "${SCRIPT_DIR}/prometheus/rules/"

  # Load the Grafana dashboard via a labelled ConfigMap (sidecar auto-imports).
  kubectl create configmap acme-overview-dashboard \
    --namespace "${MONITORING_NS}" \
    --from-file=acme-overview.json="${SCRIPT_DIR}/grafana/dashboards/acme-overview.json" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl label configmap acme-overview-dashboard -n "${MONITORING_NS}" \
    grafana_dashboard=1 --overwrite
  kubectl annotate configmap acme-overview-dashboard -n "${MONITORING_NS}" \
    grafana_folder=Acme --overwrite
  log_ok "Acme observability applied"
}

summary() {
  cat >&2 <<EOF

${C_GREEN}==================================================${C_RESET}
${C_GREEN} Observability stack is up in '${MONITORING_NS}'${C_RESET}
${C_GREEN}==================================================${C_RESET}

  Grafana (admin / admin):
    kubectl -n ${MONITORING_NS} port-forward svc/kube-prometheus-stack-grafana 3000:80
    open http://localhost:3000  → dashboard "Acme Platform — Service Overview"

  Prometheus:
    kubectl -n ${MONITORING_NS} port-forward svc/kube-prometheus-stack-prometheus 9090:9090

  Alertmanager:
    kubectl -n ${MONITORING_NS} port-forward svc/kube-prometheus-stack-alertmanager 9093:9093

  Send app traces to the collector (in-cluster):
    OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.${MONITORING_NS}.svc:4318

  Tear down:
    make observability-down

EOF
}

main() {
  section "Installing observability stack"
  preflight
  add_repos
  install_kps
  install_loki
  install_alloy
  install_otel
  apply_acme_observability
  log_ok "done"
  summary
}

main "$@"
