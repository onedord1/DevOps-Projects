#!/usr/bin/env bash
#
# 04-gateway-api.sh — install Gateway API + Envoy Gateway and create the
# shared Gateway. Replaces ingress-nginx (see ADR-0005).
#
# Steps:
#   1. Install Gateway API standard-channel CRDs (pinned).
#   2. Install Envoy Gateway via its Helm OCI chart (pinned).
#   3. Apply the GatewayClass + shared Gateway (HTTP :80) into `acme`.
# Idempotent: re-running upgrades in place.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

export KUBECONFIG="${KUBECONFIG_PATH}"

install_gateway_api_crds() {
  local url="https://github.com/kubernetes-sigs/gateway-api/releases/download/${GATEWAY_API_VERSION}/standard-install.yaml"
  log_info "installing Gateway API CRDs (${GATEWAY_API_VERSION}, standard channel)"
  kubectl apply -f "${url}"
  log_ok "Gateway API CRDs installed"
}

install_envoy_gateway() {
  require_cmd helm "https://helm.sh/docs/intro/install/" \
    || die "Helm is required to install Envoy Gateway"
  log_info "installing Envoy Gateway ${ENVOY_GATEWAY_VERSION} via Helm (OCI chart)"
  # skipCRDInstall: we manage Gateway API CRDs ourselves above.
  helm upgrade --install envoy-gateway \
    oci://docker.io/envoyproxy/gateway-helm \
    --version "${ENVOY_GATEWAY_VERSION}" \
    --namespace envoy-gateway-system --create-namespace \
    --set crds.gatewayAPI.enabled=false \
    --wait --timeout 5m
  log_info "waiting for Envoy Gateway controller to be available"
  kubectl wait --for=condition=Available deployment/envoy-gateway \
    -n envoy-gateway-system --timeout=180s
  log_ok "Envoy Gateway is ready"
}

apply_gateway() {
  log_info "applying GatewayClass + shared Gateway"
  kubectl apply -f "$(repo_root)/clusters/manifests/gateway.yaml"
  log_info "waiting for Gateway to be programmed"
  kubectl wait --for=condition=Programmed gateway/acme-gateway \
    -n acme --timeout=180s || log_warn "Gateway not Programmed yet — check 'kubectl -n acme describe gateway acme-gateway'"
  log_ok "Gateway applied"
}

main() {
  section "Gateway API (Envoy Gateway)"
  install_gateway_api_crds
  install_envoy_gateway
  apply_gateway
  log_ok "Gateway API ready — HTTPRoutes can now target 'acme-gateway' in namespace 'acme'"
}

main "$@"
