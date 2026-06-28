#!/usr/bin/env bash
#
# reset-demo.sh — reset the Acme workloads to a clean baseline between demos.
# Restores all Rollouts to `dev` tag, removes fault-injection env vars,
# and waits for everything to be Healthy.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/scripts/lib/common.sh"

DEFAULT_KUBECONFIG="${ROOT}/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"
NS="${ACME_NS:-acme}"
REGISTRY="${REGISTRY:-localhost:5000}"

main() {
  section "Resetting Acme demo to baseline"
  kubectl cluster-info >/dev/null 2>&1 || die "No cluster reachable."

  for svc in frontend payment order inventory; do
    log_info "Restoring ${svc} image to :dev and clearing fault env"
    kubectl -n "${NS}" patch rollout "${svc}" --type=json -p \
      "[{\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/image\",\"value\":\"${REGISTRY}/acme/${svc}:dev\"}]" \
      >/dev/null 2>&1 || log_warn "${svc} rollout not found"
  done

  # Reset payment FAIL_RATE to 0
  local fr_idx
  fr_idx="$(kubectl -n "${NS}" get rollout payment -o json 2>/dev/null | \
    python3 -c "import json,sys; e=json.load(sys.stdin)['spec']['template']['spec']['containers'][0]['env']; print(next((str(i) for i,x in enumerate(e) if x['name']=='FAIL_RATE'),''))" 2>/dev/null || echo "")"
  if [[ -n "${fr_idx}" ]]; then
    kubectl -n "${NS}" patch rollout payment --type=json \
      -p "[{\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/env/${fr_idx}/value\",\"value\":\"0\"}]" \
      >/dev/null 2>&1 && log_ok "payment FAIL_RATE → 0"
  fi

  # Re-apply the full overlay to guarantee known state
  log_info "Re-applying GitOps overlay..."
  kubectl apply -k "${ROOT}/gitops/acme/overlays/dev" >/dev/null

  log_info "Waiting for Rollouts to become Healthy (up to 3 min)..."
  for svc in frontend payment order inventory; do
    kubectl -n "${NS}" rollout status deploy "${svc}" --timeout=180s 2>/dev/null || true
  done

  log_ok "Demo baseline restored."
}

main "$@"
