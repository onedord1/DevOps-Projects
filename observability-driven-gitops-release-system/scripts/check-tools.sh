#!/usr/bin/env bash
#
# check-tools.sh — verify the local toolchain needed to operate the platform.
#
# Tools are grouped by the phase that first needs them, so an early-phase
# contributor isn't blocked by tools they don't need yet. Missing REQUIRED
# tools cause a non-zero exit; missing OPTIONAL tools only warn.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/lib/common.sh"

# tool|min-hint|category|install-hint
TOOLS=(
  "docker|container runtime|required|https://docs.docker.com/get-docker/"
  "kubectl|Kubernetes CLI|required|https://kubernetes.io/docs/tasks/tools/"
  "kind|local clusters|required|go install sigs.k8s.io/kind@latest"
  "helm|chart tooling|required|https://helm.sh/docs/intro/install/"
  "git|version control|required|https://git-scm.com/downloads"
  "make|task runner|required|your OS package manager"
  "kustomize|manifest overlays|optional|https://kubectl.docs.kubernetes.io/installation/kustomize/"
  "argocd|Argo CD CLI|optional|https://argo-cd.readthedocs.io/en/stable/cli_installation/"
  "kubectl-argo-rollouts|Rollouts plugin|optional|https://argoproj.github.io/argo-rollouts/installation/"
  "terraform|infrastructure as code|optional|https://developer.hashicorp.com/terraform/install"
  "trivy|vulnerability scanner|optional|https://aquasecurity.github.io/trivy/"
  "cosign|image signing|optional|https://docs.sigstore.dev/cosign/installation/"
  "syft|SBOM generator|optional|https://github.com/anchore/syft#installation"
  "jq|JSON processor|optional|your OS package manager"
  "yq|YAML processor|optional|https://github.com/mikefarah/yq#install"
)

main() {
  section "Toolchain check"
  local required_missing=0 optional_missing=0

  for entry in "${TOOLS[@]}"; do
    IFS='|' read -r tool desc category hint <<<"${entry}"
    if command -v "${tool}" >/dev/null 2>&1; then
      local version
      version="$(_tool_version "${tool}")"
      log_ok "$(printf '%-26s %s' "${tool}" "${version}")"
    else
      if [[ "${category}" == "required" ]]; then
        log_error "$(printf '%-26s MISSING (required) — %s' "${tool}" "${hint}")"
        required_missing=$((required_missing + 1))
      else
        log_warn "$(printf '%-26s missing (optional) — %s' "${tool}" "${hint}")"
        optional_missing=$((optional_missing + 1))
      fi
    fi
  done

  echo >&2
  if (( required_missing > 0 )); then
    die "${required_missing} required tool(s) missing. Install them before continuing."
  fi
  if (( optional_missing > 0 )); then
    log_warn "${optional_missing} optional tool(s) missing — needed in later phases."
  fi
  log_ok "All required tools present."
}

_tool_version() {
  local tool="$1"
  case "${tool}" in
    docker)     docker --version 2>/dev/null | head -n1 ;;
    kubectl)    kubectl version --client 2>/dev/null | head -n1 ;;
    kind)       kind --version 2>/dev/null ;;
    helm)       helm version --short 2>/dev/null ;;
    terraform)  terraform version 2>/dev/null | head -n1 ;;
    trivy)      trivy --version 2>/dev/null | head -n1 ;;
    cosign)     cosign version 2>/dev/null | grep -i 'GitVersion' | head -n1 ;;
    syft)       syft version 2>/dev/null | head -n1 ;;
    argocd)     argocd version --client 2>/dev/null | head -n1 ;;
    *)          "${tool}" --version 2>/dev/null | head -n1 || echo "present" ;;
  esac
}

main "$@"
