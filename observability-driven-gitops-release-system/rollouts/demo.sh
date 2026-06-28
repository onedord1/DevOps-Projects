#!/usr/bin/env bash
#
# demo.sh — drive the progressive-delivery loop end to end.
#
#   bash rollouts/demo.sh load            # generate storefront traffic (feeds SLIs)
#   bash rollouts/demo.sh promote <svc> <tag>   # roll out a new image tag (canary)
#   bash rollouts/demo.sh bad-payment           # ship a failing payment → auto rollback
#   bash rollouts/demo.sh status [<svc>]        # watch rollout progress
#   bash rollouts/demo.sh help
#
# Works with or without the `kubectl argo rollouts` plugin.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"
NS="${ACME_NS:-acme}"
REGISTRY="${REGISTRY:-localhost:5000}"

has_plugin() { kubectl argo rollouts version >/dev/null 2>&1; }

cmd_load() {
  require_cmd kubectl || exit 1
  local gw
  gw="$(kubectl -n acme get gateway acme-gateway -o jsonpath='{.status.addresses[0].value}' 2>/dev/null)"
  [[ -n "${gw}" ]] || die "Gateway address not ready; check 'kubectl -n acme get gateway acme-gateway'"
  log_info "generating traffic against http://${gw} (Ctrl-C to stop)"
  while true; do
    local token
    token="$(curl -s -XPOST "http://${gw}/login" -d '{"username":"demo"}' | sed -E 's/.*"access_token":"([^"]+)".*/\1/')"
    curl -s "http://${gw}/api/products" >/dev/null
    curl -s -XPOST "http://${gw}/api/checkout" -H "Authorization: Bearer ${token}" \
      -d '{"items":[{"sku":"SKU-MUG","qty":1}]}' >/dev/null
    sleep 0.5
  done
}

cmd_promote() {
  local svc="${1:?usage: promote <svc> <tag>}" tag="${2:?usage: promote <svc> <tag>}"
  local image="${REGISTRY}/acme/${svc}:${tag}"
  section "Canary: ${svc} → ${image}"
  if has_plugin; then
    kubectl argo rollouts set image "${svc}" "${svc}=${image}" -n "${NS}"
    kubectl argo rollouts get rollout "${svc}" -n "${NS}" --watch
  else
    kubectl -n "${NS}" patch rollout "${svc}" --type=json \
      -p "[{\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/image\",\"value\":\"${image}\"}]"
    log_info "watch: kubectl -n ${NS} get rollout ${svc} -w"
  fi
}

cmd_bad_payment() {
  section "Shipping a deliberately failing payment canary (FAIL_RATE=1)"
  log_info "payment-success analysis should breach its SLO and auto-rollback"
  # Flip FAIL_RATE on the payment container; this triggers a new canary revision.
  kubectl -n "${NS}" patch rollout payment --type=json -p \
    "$(python3 - <<'PY'
import json,subprocess,sys
out=subprocess.check_output(["kubectl","-n","acme","get","rollout","payment","-o","json"])
spec=json.loads(out)
env=spec["spec"]["template"]["spec"]["containers"][0]["env"]
idx=next((i for i,e in enumerate(env) if e["name"]=="FAIL_RATE"), None)
patch=[{"op":"replace","path":f"/spec/template/spec/containers/0/env/{idx}/value","value":"1"}]
print(json.dumps(patch))
PY
)"
  if has_plugin; then
    kubectl argo rollouts get rollout payment -n "${NS}" --watch
  else
    log_info "watch: kubectl -n ${NS} get rollout payment -w"
  fi
}

cmd_status() {
  local svc="${1:-frontend}"
  if has_plugin; then
    kubectl argo rollouts get rollout "${svc}" -n "${NS}" --watch
  else
    kubectl -n "${NS}" get rollout "${svc}" -o wide -w
  fi
}

usage() {
  sed -n '2,14p' "${BASH_SOURCE[0]}"
}

case "${1:-help}" in
  load)        cmd_load ;;
  promote)     shift; cmd_promote "$@" ;;
  bad-payment) cmd_bad_payment ;;
  status)      shift; cmd_status "$@" ;;
  *)           usage ;;
esac
