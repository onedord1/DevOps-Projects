#!/usr/bin/env bash
# slos/deploy-report.sh — query Prometheus + incident service and print a
# structured deployment health report.
#
# Usage:
#   ./slos/deploy-report.sh
#   ./slos/deploy-report.sh --service payment
#   ./slos/deploy-report.sh --json reports/my-report.json
#
# Environment variables:
#   PROMETHEUS_URL   Prometheus base URL   (default: http://localhost:9090)
#   INCIDENT_URL     Incident service URL  (default: http://localhost:8090)
#
# Dependencies: curl, python3 (for JSON parsing + report writing)

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/../scripts/lib/common.sh"

REPO="$(repo_root)"

# ---- defaults ---------------------------------------------------------------
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
INCIDENT_URL="${INCIDENT_URL:-http://localhost:8090}"
SERVICE_FILTER=""
JSON_OUTPUT=""

# ---- arg parsing ------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)
      shift
      [[ $# -eq 0 ]] && die "--service requires a value"
      SERVICE_FILTER="$1"
      ;;
    --json)
      shift
      [[ $# -eq 0 ]] && die "--json requires a path"
      JSON_OUTPUT="$1"
      ;;
    --help|-h)
      cat >&2 <<EOF
Usage: $(basename "$0") [--service <name>] [--json <path>]

Options:
  --service <name>   Filter report to a single service (frontend|payment|order|inventory)
  --json <path>      Write a JSON report to <path> (created with timestamp if omitted)

Environment:
  PROMETHEUS_URL     (default: http://localhost:9090)
  INCIDENT_URL       (default: http://localhost:8090)
EOF
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
  shift
done

# ---- helpers ----------------------------------------------------------------
# prom_query_avg <promql> — return the average scalar value as a float string
prom_query_avg() {
  local query="$1"
  local encoded
  encoded="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "${query}")"
  local url="${PROMETHEUS_URL}/api/v1/query?query=${encoded}"
  local result
  result="$(curl -sf --max-time 10 "${url}" 2>/dev/null || echo '{}')"
  python3 - "${result}" <<'PYEOF'
import sys, json
d = json.loads(sys.argv[1])
results = d.get("data", {}).get("result", [])
if not results:
    print("N/A")
else:
    vals = [float(r["value"][1]) for r in results if r.get("value")]
    if vals:
        print(f"{sum(vals)/len(vals):.4f}")
    else:
        print("N/A")
PYEOF
}

# prom_query_range_avg <promql> <duration> — average over last <duration>
prom_query_range_avg() {
  local query="$1" duration="${2:-24h}"
  prom_query_avg "avg_over_time((${query})[${duration}:5m])"
}

# fetch_incidents — returns raw JSON from the incident service
fetch_incidents() {
  curl -sf --max-time 10 "${INCIDENT_URL}/incidents" 2>/dev/null || echo '{"incidents":[]}'
}

# format_pct <value> — convert 0-1 ratio to readable percentage
format_pct() {
  local v="$1"
  if [[ "${v}" == "N/A" ]]; then
    echo "N/A"
  else
    python3 -c "v=float('${v}'); print(f'{v*100:.2f}%')"
  fi
}

# ---- report timestamp -------------------------------------------------------
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_DATE="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

section "Deployment Report — ${REPORT_DATE}"

# ---- services to report on --------------------------------------------------
ALL_SERVICES=(frontend payment order inventory)
if [[ -n "${SERVICE_FILTER}" ]]; then
  SERVICES=("${SERVICE_FILTER}")
else
  SERVICES=("${ALL_SERVICES[@]}")
fi

# ---- SLI snapshot (last 24h average) ----------------------------------------
section "SLI Snapshot (last 24h average)"

declare -A SLI_SUCCESS SLI_LATENCY SLI_PAYMENT SLI_CHECKOUT

for svc in "${SERVICES[@]}"; do
  log_info "Querying SLIs for: ${svc}"
  SLI_SUCCESS["${svc}"]="$(prom_query_range_avg \
    "acme:request_success_ratio:5m{service=\"${svc}\"}" "24h")"
  SLI_LATENCY["${svc}"]="$(prom_query_range_avg \
    "acme:request_latency_p95:5m{service=\"${svc}\"}" "24h")"
done

# Business SLIs
SLI_PAYMENT["payment"]="$(prom_query_range_avg "acme:payment_success_ratio:5m" "24h")"
SLI_CHECKOUT["order"]="$(prom_query_range_avg "acme:checkout_success_ratio:5m" "24h")"

echo ""
printf '%-14s  %-14s  %-14s  %-16s  %-18s\n' \
  "SERVICE" "SUCCESS RATE" "P95 LATENCY" "PAYMENT OK" "CHECKOUT OK"
printf '%-14s  %-14s  %-14s  %-16s  %-18s\n' \
  "--------------" "--------------" "--------------" "----------------" "------------------"

for svc in "${SERVICES[@]}"; do
  payment_col="—"
  checkout_col="—"
  if [[ "${svc}" == "payment" ]]; then
    payment_col="$(format_pct "${SLI_PAYMENT["payment"]}")"
  fi
  if [[ "${svc}" == "order" ]]; then
    checkout_col="$(format_pct "${SLI_CHECKOUT["order"]}")"
  fi
  lat="${SLI_LATENCY[${svc}]}"
  lat_fmt="${lat}"
  if [[ "${lat}" != "N/A" ]]; then
    lat_fmt="$(python3 -c "print(f'{float(\"${lat}\")*1000:.0f}ms')")"
  fi
  printf '%-14s  %-14s  %-14s  %-16s  %-18s\n' \
    "${svc}" \
    "$(format_pct "${SLI_SUCCESS[${svc}]}")" \
    "${lat_fmt}" \
    "${payment_col}" \
    "${checkout_col}"
done

# ---- incident summary -------------------------------------------------------
section "Incident Summary"

INCIDENTS_JSON="$(fetch_incidents)"

OPEN_COUNT="$(python3 -c "
import sys,json
d=json.loads(sys.argv[1])
print(len([i for i in d.get('incidents',[]) if i.get('status')=='open']))
" "${INCIDENTS_JSON}")"

CLOSED_24H_COUNT="$(python3 -c "
import sys,json
from datetime import datetime, timezone, timedelta
d=json.loads(sys.argv[1])
cutoff=(datetime.now(timezone.utc)-timedelta(hours=24)).isoformat()
print(len([i for i in d.get('incidents',[])
           if i.get('status')=='resolved'
           and (i.get('resolved_at') or '') >= cutoff]))
" "${INCIDENTS_JSON}")"

echo ""
echo "  Open incidents:              ${OPEN_COUNT}"
echo "  Closed incidents (last 24h): ${CLOSED_24H_COUNT}"
echo ""

# Open incidents detail
if [[ "${OPEN_COUNT}" -gt 0 ]]; then
  log_warn "Open incidents:"
  python3 - "${INCIDENTS_JSON}" <<'PYEOF'
import sys,json
d=json.loads(sys.argv[1])
for i in d.get("incidents",[]):
    if i.get("status")=="open":
        print(f"  [{i.get('severity','?').upper():8}] {i.get('service','-'):12} {i.get('title','-')}")
        print(f"           source={i.get('source','-')}  opened={i.get('created_at','-')}")
PYEOF
  echo ""
fi

# Closed incidents last 24h
if [[ "${CLOSED_24H_COUNT}" -gt 0 ]]; then
  log_info "Incidents closed in last 24h:"
  python3 - "${INCIDENTS_JSON}" <<'PYEOF'
import sys,json
from datetime import datetime, timezone, timedelta
d=json.loads(sys.argv[1])
cutoff=(datetime.now(timezone.utc)-timedelta(hours=24)).isoformat()
for i in d.get("incidents",[]):
    if i.get("status")=="resolved" and (i.get("resolved_at") or "") >= cutoff:
        print(f"  [{i.get('severity','?').upper():8}] {i.get('service','-'):12} {i.get('title','-')}")
        print(f"           resolved={i.get('resolved_at','-')}")
PYEOF
  echo ""
fi

# ---- JSON report output (optional) ------------------------------------------
if [[ -n "${JSON_OUTPUT}" ]] || [[ "${JSON_OUTPUT:-}" == "" && "${1:-}" == "" ]]; then
  if [[ -z "${JSON_OUTPUT}" ]]; then
    mkdir -p "${REPO}/reports"
    JSON_OUTPUT="${REPO}/reports/deploy-report-${TIMESTAMP}.json"
  fi

  # Build JSON only if an explicit --json flag was passed
  if [[ -n "${JSON_OUTPUT}" ]]; then
    mkdir -p "$(dirname "${JSON_OUTPUT}")"
    python3 - "${JSON_OUTPUT}" "${INCIDENTS_JSON}" "${REPORT_DATE}" "${TIMESTAMP}" "${SERVICE_FILTER}" <<'PYEOF'
import sys, json
from datetime import datetime, timezone, timedelta

out_path   = sys.argv[1]
incidents  = json.loads(sys.argv[2])
report_date= sys.argv[3]
timestamp  = sys.argv[4]
svc_filter = sys.argv[5]

cutoff=(datetime.now(timezone.utc)-timedelta(hours=24)).isoformat()
open_inc = [i for i in incidents.get("incidents",[]) if i.get("status")=="open"]
closed_inc= [i for i in incidents.get("incidents",[])
             if i.get("status")=="resolved" and (i.get("resolved_at") or "")>=cutoff]

report = {
    "generated_at": report_date,
    "timestamp": timestamp,
    "service_filter": svc_filter or "all",
    "open_incidents": open_inc,
    "closed_incidents_24h": closed_inc,
    "note": "SLI values not included in JSON (query Prometheus directly)"
}
with open(out_path, "w") as fh:
    json.dump(report, fh, indent=2)
print(f"  JSON report written: {out_path}")
PYEOF
  fi
fi

log_ok "Report complete"
