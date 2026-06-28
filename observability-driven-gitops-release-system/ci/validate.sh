#!/usr/bin/env bash
#
# validate.sh — local sanity checks for the CI pipeline (no GitLab runner):
#   - .gitlab-ci.yml parses as YAML and declares the expected stages
#   - the release `sed` actually bumps the overlay newTag values

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

PIPELINE="${SCRIPT_DIR}/.gitlab-ci.yml"
OVERLAY="$(repo_root)/gitops/acme/overlays/dev/kustomization.yaml"

main() {
  section "Validating GitLab CI pipeline"
  require_cmd python3 "your OS package manager" || exit 1

  python3 - "$PIPELINE" <<'PY'
import sys, yaml
doc = yaml.safe_load(open(sys.argv[1]))
expected = ["build", "scan", "sbom", "sign", "release"]
assert doc.get("stages") == expected, f"stages mismatch: {doc.get('stages')}"
for job in expected:
    assert job in doc, f"missing job: {job}"
print("pipeline OK: stages + jobs present")
PY
  log_ok "pipeline YAML valid"

  section "Verifying release tag-bump logic"
  local tmp; tmp="$(mktemp -d)"
  cp "${OVERLAY}" "${tmp}/kustomization.yaml"
  local IMAGE_TAG="testsha123"
  for svc in frontend payment order inventory notification; do
    sed -i -E "/name: acme\/${svc}\$/,/newTag:/ s/(newTag:).*/\1 ${IMAGE_TAG}/" "${tmp}/kustomization.yaml"
  done
  local count
  count="$(grep -c "newTag: ${IMAGE_TAG}" "${tmp}/kustomization.yaml")"
  rm -rf "${tmp}"
  if [[ "${count}" == "5" ]]; then
    log_ok "release sed bumps all 5 service tags"
  else
    die "expected 5 tag bumps, got ${count}"
  fi
}

main "$@"
