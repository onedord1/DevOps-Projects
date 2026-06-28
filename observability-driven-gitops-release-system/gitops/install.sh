#!/usr/bin/env bash
#
# install.sh — install Argo CD and bootstrap the app-of-apps. After this, Argo
# CD reconciles the whole platform (observability + Acme) from Git. Idempotent.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/charts.env"

DEFAULT_KUBECONFIG="$(repo_root)/clusters/.kubeconfig"
export KUBECONFIG="${KUBECONFIG:-${DEFAULT_KUBECONFIG}}"

preflight() {
  require_cmd helm "https://helm.sh/docs/intro/install/" || exit 1
  require_cmd kubectl "https://kubernetes.io/docs/tasks/tools/" || exit 1
  kubectl cluster-info >/dev/null 2>&1 || die "cannot reach a cluster (KUBECONFIG=${KUBECONFIG}). Run 'make up'."
}

install_argocd() {
  section "Argo CD ${ARGOCD_CHART_VERSION}"
  helm repo add argo "${REPO_ARGO}" >/dev/null 2>&1 || true
  helm repo update argo >/dev/null
  helm upgrade --install argocd argo/argo-cd \
    --version "${ARGOCD_CHART_VERSION}" \
    --namespace "${ARGOCD_NS}" --create-namespace \
    -f "${SCRIPT_DIR}/values/argocd.values.yaml" \
    --wait --timeout 10m
  log_info "waiting for Argo CD CRDs to be established"
  kubectl wait --for=condition=established --timeout=120s \
    crd/applications.argoproj.io crd/appprojects.argoproj.io
  log_ok "Argo CD installed"
}

bootstrap_apps() {
  section "Bootstrapping projects + app-of-apps"
  kubectl apply -f "${SCRIPT_DIR}/projects/"
  kubectl apply -f "${SCRIPT_DIR}/bootstrap/root-app.yaml"
  log_ok "root Application applied — Argo CD will reconcile the platform from Git"
}

summary() {
  local pw
  pw="$(kubectl -n "${ARGOCD_NS}" get secret argocd-initial-admin-secret \
        -o jsonpath='{.data.password}' 2>/dev/null | base64 -d 2>/dev/null || true)"
  cat >&2 <<EOF

${C_GREEN}=====================================================${C_RESET}
${C_GREEN} Argo CD is up — the platform is now GitOps-managed${C_RESET}
${C_GREEN}=====================================================${C_RESET}

  UI (admin / ${pw:-<see below>}):
    kubectl -n ${ARGOCD_NS} port-forward svc/argocd-server 8081:80
    open http://localhost:8081
    # password: kubectl -n ${ARGOCD_NS} get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d

  Watch applications reconcile:
    kubectl -n ${ARGOCD_NS} get applications -w

  NOTE: the Acme app pulls images from the local registry. Build/push them:
    PUSH=1 make build-apps

  Re-point at a fork before installing:
    GITOPS_REPO_URL=https://github.com/you/your-repo.git bash gitops/set-repo.sh

EOF
}

main() {
  section "Installing GitOps control plane"
  preflight
  install_argocd
  bootstrap_apps
  log_ok "done"
  summary
}

main "$@"
