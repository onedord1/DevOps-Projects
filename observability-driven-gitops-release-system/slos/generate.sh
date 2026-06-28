#!/usr/bin/env bash
# slos/generate.sh — generate Prometheus SLO rules from Sloth definitions.
#
# Usage:
#   ./slos/generate.sh            # generate all SLOs in slos/sloth/
#   ./slos/generate.sh --validate # only validate existing generated YAML
#
# Requires: sloth v0.16.0+ (https://github.com/slok/sloth/releases)
# If sloth is not installed, the script prints install instructions and exits 1.
# Generated files are written to slos/generated/ and validated with python3.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

REPO="$(repo_root)"
SLOTH_INPUT="${REPO}/slos/sloth"
SLOTH_OUTPUT="${REPO}/slos/generated"
SLOTH_VERSION="v0.16.0"

# ----------------------------------------------------------------------------
usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") [--validate]

  --validate    Skip generation; only validate YAML already in slos/generated/
  --help        Show this help

Environment variables:
  SLOTH_BIN     Path to the sloth binary (default: sloth in PATH)
EOF
}

VALIDATE_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --validate) VALIDATE_ONLY=1 ;;
    --help|-h)  usage; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
  shift
done

# ----------------------------------------------------------------------------
section "SLO Rule Generation (Sloth ${SLOTH_VERSION})"

if [[ "${VALIDATE_ONLY}" -eq 0 ]]; then
  SLOTH_BIN="${SLOTH_BIN:-sloth}"

  if ! command -v "${SLOTH_BIN}" >/dev/null 2>&1; then
    log_warn "sloth binary not found — cannot generate rules."
    log_warn ""
    log_warn "Install sloth ${SLOTH_VERSION}:"
    log_warn "  # Linux/macOS (replace OS/ARCH as needed):"
    log_warn "  curl -sSL https://github.com/slok/sloth/releases/download/${SLOTH_VERSION}/sloth-linux-amd64 \\"
    log_warn "    -o /usr/local/bin/sloth && chmod +x /usr/local/bin/sloth"
    log_warn ""
    log_warn "  # macOS Homebrew (unofficial tap):"
    log_warn "  brew install slok/tap/sloth"
    log_warn ""
    log_warn "  # Verify:"
    log_warn "  sloth version"
    log_warn ""
    log_warn "Skipping generation. Pre-generated files in slos/generated/ are"
    log_warn "committed to the repo and remain valid for offline use."
    exit 1
  fi

  ACTUAL_VERSION="$("${SLOTH_BIN}" version 2>/dev/null | grep -oP 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")"
  log_info "sloth binary: ${SLOTH_BIN} (${ACTUAL_VERSION})"

  mkdir -p "${SLOTH_OUTPUT}"

  log_info "Generating SLO rules: ${SLOTH_INPUT}/ → ${SLOTH_OUTPUT}/"
  "${SLOTH_BIN}" generate \
    -i "${SLOTH_INPUT}" \
    -o "${SLOTH_OUTPUT}"

  log_ok "Sloth generation complete"
else
  log_info "Validate-only mode — skipping generation"
fi

# ----------------------------------------------------------------------------
section "Validating generated YAML"

if [[ ! -d "${SLOTH_OUTPUT}" ]]; then
  die "Output directory not found: ${SLOTH_OUTPUT}"
fi

YAML_FILES=()
while IFS= read -r -d '' f; do
  YAML_FILES+=("$f")
done < <(find "${SLOTH_OUTPUT}" -name '*.yaml' -print0 | sort -z)

if [[ ${#YAML_FILES[@]} -eq 0 ]]; then
  log_warn "No YAML files found in ${SLOTH_OUTPUT}"
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  log_warn "python3 not found — skipping YAML parse validation"
else
  FAIL=0
  for f in "${YAML_FILES[@]}"; do
    rel="${f#"${REPO}/"}"
    if python3 - "${f}" <<'PYEOF'
import sys, yaml
with open(sys.argv[1]) as fh:
    list(yaml.safe_load_all(fh))
PYEOF
    then
      log_ok "  YAML valid: ${rel}"
    else
      log_error "  YAML invalid: ${rel}"
      FAIL=1
    fi
  done

  if [[ "${FAIL}" -ne 0 ]]; then
    die "One or more generated YAML files failed validation"
  fi
  log_ok "All ${#YAML_FILES[@]} generated YAML file(s) are valid"
fi

log_ok "Done — generated files are in slos/generated/"
