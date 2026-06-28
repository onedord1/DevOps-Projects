#!/usr/bin/env bash
#
# 01-local-registry.sh — start a local Docker registry for the platform.
# Idempotent: re-running reuses a healthy registry container.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/config.env"

registry_state() {
  docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || echo "absent"
}

main() {
  section "Local container registry"
  local state
  state="$(registry_state)"

  case "${state}" in
    true)
      log_ok "registry '${REGISTRY_NAME}' already running on :${REGISTRY_PORT}"
      ;;
    false)
      log_info "registry '${REGISTRY_NAME}' exists but stopped — starting it"
      docker start "${REGISTRY_NAME}" >/dev/null
      log_ok "registry started on :${REGISTRY_PORT}"
      ;;
    *)
      log_info "creating registry '${REGISTRY_NAME}' (${REGISTRY_IMAGE}) on :${REGISTRY_PORT}"
      docker run -d \
        --name "${REGISTRY_NAME}" \
        --restart=unless-stopped \
        -p "${REGISTRY_PORT}:5000" \
        -v "${REGISTRY_NAME}-data:/var/lib/registry" \
        "${REGISTRY_IMAGE}" >/dev/null
      log_ok "registry created on :${REGISTRY_PORT}"
      ;;
  esac

  # Verify the registry HTTP API answers.
  if curl -sf "http://localhost:${REGISTRY_PORT}/v2/" >/dev/null; then
    log_ok "registry API reachable at http://localhost:${REGISTRY_PORT}/v2/"
  else
    die "registry did not become reachable on :${REGISTRY_PORT}"
  fi
}

main "$@"
