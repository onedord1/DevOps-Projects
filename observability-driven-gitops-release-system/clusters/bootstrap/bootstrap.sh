#!/usr/bin/env bash
#
# bootstrap.sh — bring up the full local platform foundation (Phase 2).
# Runs each step in order; every step is idempotent and safe to re-run.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

STEPS=(
  "00-preflight.sh"
  "01-local-registry.sh"
  "02-install-k3s.sh"
  "03-ingress-nginx.sh"
  "04-namespaces.sh"
)

print_summary() {
  cat >&2 <<EOF

${C_GREEN}========================================================${C_RESET}
${C_GREEN} Platform foundation is up — Acme '${CLUSTER_NAME}'${C_RESET}
${C_GREEN}========================================================${C_RESET}

  Use the cluster:
    export KUBECONFIG=${KUBECONFIG_PATH}
    kubectl get nodes
    kubectl get ns

  Local registry:
    http://localhost:${REGISTRY_PORT}/v2/_catalog

  Inspect / verify:
    make cluster-info

  Tear everything down:
    make down

EOF
}

main() {
  local start_ts; start_ts="$(date +%s)"
  section "Bootstrapping Acme platform (k3s ${K3S_VERSION})"
  for step in "${STEPS[@]}"; do
    log_info "running step: ${step}"
    bash "${SCRIPT_DIR}/${step}"
  done
  local elapsed=$(( $(date +%s) - start_ts ))
  log_ok "bootstrap finished in ${elapsed}s"
  print_summary
}

main "$@"
