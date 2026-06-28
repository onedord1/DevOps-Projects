#!/usr/bin/env bash
#
# 00-preflight.sh — verify the host can run a local k3s platform.
# Fails fast on hard requirements; warns on soft ones.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

check_os() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    die "k3s requires Linux. Detected: $(uname -s). Use a Linux VM or WSL2."
  fi
  log_ok "operating system: Linux"
}

check_sudo() {
  require_cmd sudo "your OS package manager" || die "sudo is required to install k3s"
  if sudo -n true 2>/dev/null; then
    log_ok "sudo: available (cached credentials)"
  else
    log_warn "sudo will prompt for your password during install"
  fi
}

check_required_cmds() {
  local missing=0
  require_cmd curl "your OS package manager"   || missing=1
  require_cmd docker "https://docs.docker.com/get-docker/" || missing=1
  require_cmd kubectl "https://kubernetes.io/docs/tasks/tools/" || missing=1
  (( missing == 0 )) || die "install the missing required commands above"
  log_ok "required commands present (curl, docker, kubectl)"
}

check_docker_running() {
  if docker info >/dev/null 2>&1; then
    log_ok "docker daemon: running"
  else
    die "docker daemon is not running or not accessible by this user"
  fi
}

check_port() {
  local port="$1" label="$2"
  if (exec 3<>"/dev/tcp/127.0.0.1/${port}") 2>/dev/null; then
    exec 3>&- 2>/dev/null || true
    log_warn "port ${port} (${label}) is already in use — bring-up may conflict"
  else
    log_ok "port ${port} (${label}) is free"
  fi
}

main() {
  section "Preflight checks"
  check_os
  check_sudo
  check_required_cmds
  check_docker_running
  check_port 6443 "k3s API server"
  check_port "${REGISTRY_PORT}" "local registry"
  check_port 80 "ingress HTTP"
  check_port 443 "ingress HTTPS"
  log_ok "preflight complete"
}

main "$@"
