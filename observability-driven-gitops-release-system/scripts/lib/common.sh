#!/usr/bin/env bash
#
# common.sh — shared utilities sourced by every script in this repository.
#
# Usage:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   # shellcheck source=/dev/null
#   source "${SCRIPT_DIR}/lib/common.sh"
#
# Provides: strict mode, colored leveled logging, command guards, and
# small helpers. Keep this file dependency-free (POSIX-ish bash only).

# ---- strict mode ------------------------------------------------------------
set -Eeuo pipefail

# ---- colors (disabled when not a TTY or NO_COLOR is set) --------------------
if [[ -t 2 && -z "${NO_COLOR:-}" ]]; then
  readonly C_RESET=$'\033[0m'
  readonly C_RED=$'\033[31m'
  readonly C_GREEN=$'\033[32m'
  readonly C_YELLOW=$'\033[33m'
  readonly C_BLUE=$'\033[34m'
  readonly C_DIM=$'\033[2m'
else
  readonly C_RESET="" C_RED="" C_GREEN="" C_YELLOW="" C_BLUE="" C_DIM=""
fi

# ---- logging ----------------------------------------------------------------
_log() {
  # _log LEVEL COLOR MESSAGE...
  local level="$1" color="$2"; shift 2
  printf '%s%s[%s]%s %s\n' "${color}" "${C_DIM}" "${level}" "${C_RESET}" "$*" >&2
}
log_info()  { _log "INFO"  "${C_BLUE}"   "$*"; }
log_ok()    { _log " OK "  "${C_GREEN}"  "$*"; }
log_warn()  { _log "WARN"  "${C_YELLOW}" "$*"; }
log_error() { _log "FAIL"  "${C_RED}"    "$*"; }

die() { log_error "$*"; exit 1; }

# ---- section banner ---------------------------------------------------------
section() {
  printf '\n%s==> %s%s\n' "${C_BLUE}" "$*" "${C_RESET}" >&2
}

# ---- guards -----------------------------------------------------------------
# require_cmd <command> [hint]
require_cmd() {
  local cmd="$1" hint="${2:-}"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log_error "required command not found: ${cmd}"
    [[ -n "${hint}" ]] && log_error "  install: ${hint}"
    return 1
  fi
}

# confirm <prompt> — returns 0 on yes. Auto-yes when ASSUME_YES=1.
confirm() {
  local prompt="${1:-Continue?}"
  if [[ "${ASSUME_YES:-0}" == "1" ]]; then
    return 0
  fi
  local reply
  read -r -p "${prompt} [y/N] " reply
  [[ "${reply}" =~ ^[Yy]$ ]]
}

# repo_root — absolute path to the repository root (parent of scripts/).
repo_root() {
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  printf '%s\n' "${here}"
}

# on_error trap for friendlier failures
_common_on_error() {
  local exit_code=$?
  log_error "command failed (exit ${exit_code}) at line ${BASH_LINENO[0]}: ${BASH_COMMAND}"
  exit "${exit_code}"
}
trap _common_on_error ERR
