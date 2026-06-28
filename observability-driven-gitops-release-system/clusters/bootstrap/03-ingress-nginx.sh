#!/usr/bin/env bash
#
# 03-ingress-nginx.sh — install the ingress-nginx controller.
# Prefers Helm when available (repeatable upgrades); otherwise applies the
# pinned upstream static manifest. Either way the version is pinned.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

export KUBECONFIG="${KUBECONFIG_PATH}"

install_via_helm() {
  log_info "installing ingress-nginx via Helm (chart pinned to controller ${INGRESS_NGINX_VERSION})"
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null 2>&1 || true
  helm repo update ingress-nginx >/dev/null
  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx --create-namespace \
    --set controller.image.tag="${INGRESS_NGINX_VERSION}" \
    --set controller.service.type=LoadBalancer \
    --set controller.publishService.enabled=true \
    --wait --timeout 5m
  log_ok "ingress-nginx installed via Helm"
}

install_via_manifest() {
  local url="https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-${INGRESS_NGINX_VERSION}/deploy/static/provider/cloud/deploy.yaml"
  log_info "Helm not found — applying pinned static manifest"
  log_info "manifest: ${url}"
  kubectl apply -f "${url}"
}

wait_ready() {
  log_info "waiting for ingress-nginx controller to be ready"
  kubectl rollout status deployment/ingress-nginx-controller \
    -n ingress-nginx --timeout=180s
  log_ok "ingress-nginx controller is ready"
}

main() {
  section "Ingress controller (ingress-nginx)"
  if command -v helm >/dev/null 2>&1; then
    install_via_helm
  else
    install_via_manifest
    wait_ready
  fi
  log_ok "ingress available — LoadBalancer Service backed by k3s servicelb"
}

main "$@"
