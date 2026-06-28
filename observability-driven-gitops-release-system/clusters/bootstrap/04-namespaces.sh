#!/usr/bin/env bash
#
# 04-namespaces.sh — create the platform namespaces.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

export KUBECONFIG="${KUBECONFIG_PATH}"

main() {
  section "Platform namespaces"
  kubectl apply -f "$(repo_root)/clusters/manifests/namespaces.yaml"
  for ns in "${PLATFORM_NAMESPACES[@]}"; do
    kubectl get namespace "${ns}" >/dev/null
    log_ok "namespace present: ${ns}"
  done
}

main "$@"
