#!/usr/bin/env bash
#
# 02-install-k3s.sh — install a single-node k3s cluster, pinned + configured.
# Idempotent: if a k3s node is already Ready, the install is skipped.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

K3S_DATA="$(repo_root)/clusters/k3s"

stage_config() {
  log_info "staging k3s config + registry mirror into ${K3S_CONFIG_DIR}"
  sudo mkdir -p "${K3S_CONFIG_DIR}"
  sudo cp "${K3S_DATA}/config.yaml"      "${K3S_CONFIG_DIR}/config.yaml"
  sudo cp "${K3S_DATA}/registries.yaml"  "${K3S_CONFIG_DIR}/registries.yaml"
  log_ok "config staged"
}

already_installed() {
  command -v k3s >/dev/null 2>&1 && sudo systemctl is-active --quiet k3s 2>/dev/null
}

install_k3s() {
  log_info "installing k3s ${K3S_VERSION} (this downloads the k3s binary)"
  curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="${K3S_VERSION}" sh -s -
  log_ok "k3s installed and service started"
}

export_kubeconfig() {
  log_info "exporting kubeconfig to ${KUBECONFIG_PATH}"
  sudo cp "${K3S_CONFIG_DIR}/k3s.yaml" "${KUBECONFIG_PATH}"
  sudo chown "$(id -u):$(id -g)" "${KUBECONFIG_PATH}"
  chmod 600 "${KUBECONFIG_PATH}"
  export KUBECONFIG="${KUBECONFIG_PATH}"
  log_ok "kubeconfig ready (KUBECONFIG=${KUBECONFIG_PATH})"
}

wait_ready() {
  log_info "waiting for the node to become Ready"
  KUBECONFIG="${KUBECONFIG_PATH}" kubectl wait --for=condition=Ready node --all --timeout=120s
  log_ok "node is Ready"
}

main() {
  section "k3s cluster"
  stage_config
  if already_installed; then
    log_ok "k3s already installed and active — skipping installer"
  else
    install_k3s
  fi
  export_kubeconfig
  wait_ready
}

main "$@"
