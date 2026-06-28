#!/usr/bin/env bash
#
# build-apps.sh — build (and optionally push) the Acme service images.
#
# Each service is built from the shared multi-stage apps/Dockerfile and tagged
# for the local registry started in Phase 2.
#
#   TAG=dev            image tag (default: short git sha, else "dev")
#   PUSH=1             push to the local registry after building
#   REGISTRY=host:port image registry (default: localhost:5000)
#   SERVICES="a b"     subset of services to build (default: all five)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/lib/common.sh"

REGISTRY="${REGISTRY:-localhost:5000}"
NAMESPACE="acme"
APPS_DIR="$(repo_root)/apps"
DEFAULT_SERVICES=(frontend payment order inventory notification)

resolve_tag() {
  if [[ -n "${TAG:-}" ]]; then
    printf '%s' "${TAG}"
  elif git -C "$(repo_root)" rev-parse --short HEAD >/dev/null 2>&1; then
    git -C "$(repo_root)" rev-parse --short HEAD
  else
    printf 'dev'
  fi
}

main() {
  require_cmd docker "https://docs.docker.com/get-docker/" || exit 1
  local tag; tag="$(resolve_tag)"
  read -r -a services <<<"${SERVICES:-${DEFAULT_SERVICES[*]}}"

  section "Building Acme images (tag=${tag}, registry=${REGISTRY})"
  for svc in "${services[@]}"; do
    local image="${REGISTRY}/${NAMESPACE}/${svc}:${tag}"
    log_info "building ${image}"
    docker build \
      --build-arg "SERVICE=${svc}" \
      --build-arg "VERSION=${tag}" \
      -t "${image}" \
      -f "${APPS_DIR}/Dockerfile" \
      "${APPS_DIR}"
    log_ok "built ${image}"

    if [[ "${PUSH:-0}" == "1" ]]; then
      log_info "pushing ${image}"
      docker push "${image}"
      log_ok "pushed ${image}"
    fi
  done

  log_ok "done (${#services[@]} image(s), tag ${tag})"
  [[ "${PUSH:-0}" == "1" ]] || log_info "set PUSH=1 to push to ${REGISTRY}"
}

main "$@"
