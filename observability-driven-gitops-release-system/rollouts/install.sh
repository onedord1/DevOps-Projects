#!/usr/bin/env bash
#
# install.sh — install Argo Rollouts (+ Gateway API traffic-router plugin) and
# its HTTPRoute RBAC. Imperative quickstart; under GitOps these are managed by
# the argo-rollouts / rollouts-rbac Applications. Idempotent.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

ROLLOUTS_NS="${ROLLOUTS_NS:-argo-rollouts}"
ROLLOUTS_CHART_VERSION="${ROLLOUTS_CHART_VERSION:-2.41.0}"
REPO_ARGO="https://argoproj.github.io/argo-helm"

main() {
  section "Argo Rollouts ${ROLLOUTS_CHART_VERSION}"
  require_cmd helm "https://helm.sh/docs/intro/install/" || exit 1
  require_cmd kubectl "https://kubernetes.io/docs/tasks/tools/" || exit 1
  kubectl cluster-info >/dev/null 2>&1 || die "cannot reach a cluster. Run 'make up'."

  helm repo add argo "${REPO_ARGO}" >/dev/null 2>&1 || true
  helm repo update argo >/dev/null
  helm upgrade --install argo-rollouts argo/argo-rollouts \
    --version "${ROLLOUTS_CHART_VERSION}" \
    --namespace "${ROLLOUTS_NS}" --create-namespace \
    -f "${SCRIPT_DIR}/values/argo-rollouts.values.yaml" \
    --wait --timeout 5m

  log_info "applying Gateway API plugin RBAC"
  kubectl apply -f "${SCRIPT_DIR}/rbac/"

  log_ok "Argo Rollouts installed"
  cat >&2 <<EOF

  Rollouts + AnalysisTemplates deploy via the GitOps 'acme' app, or directly:
    kubectl apply -k $(repo_root)/gitops/acme/overlays/dev

  Optional CLI plugin (nice live view):
    https://argoproj.github.io/argo-rollouts/installation/#kubectl-plugin-installation
    kubectl argo rollouts get rollout frontend -n acme --watch

  Try the demo:
    bash rollouts/demo.sh help
EOF
}

main "$@"
