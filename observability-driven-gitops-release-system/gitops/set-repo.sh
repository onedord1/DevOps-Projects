#!/usr/bin/env bash
#
# set-repo.sh — re-point every GitOps manifest at a different repository/branch.
# Useful after forking. Replaces the committed default repoURL across gitops/.
#
#   GITOPS_REPO_URL=https://github.com/you/your-repo.git \
#   GITOPS_TARGET_REVISION=main \
#   bash gitops/set-repo.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

DEFAULT_URL="https://github.com/onedord1/DevOps-Projects.git"
NEW_URL="${GITOPS_REPO_URL:-}"
NEW_REV="${GITOPS_TARGET_REVISION:-}"

[[ -n "${NEW_URL}" ]] || die "set GITOPS_REPO_URL=https://github.com/you/your-repo.git"

section "Re-pointing GitOps manifests"
mapfile -t files < <(grep -rl "${DEFAULT_URL}" "${SCRIPT_DIR}")
for f in "${files[@]}"; do
  sed -i "s#${DEFAULT_URL}#${NEW_URL}#g" "$f"
  log_ok "repoURL → ${NEW_URL} in $(basename "$f")"
done

if [[ -n "${NEW_REV}" ]]; then
  # Update targetRevision (HEAD by default) in Application manifests.
  grep -rl "targetRevision:" "${SCRIPT_DIR}" | while read -r f; do
    sed -i -E "s/(targetRevision:[[:space:]]*).*/\1${NEW_REV}/" "$f"
  done
  log_ok "targetRevision → ${NEW_REV}"
fi

log_ok "done — commit the changes, then run: make gitops"
