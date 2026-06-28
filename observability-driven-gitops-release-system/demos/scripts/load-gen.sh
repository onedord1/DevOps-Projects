#!/usr/bin/env bash
#
# load-gen.sh — continuous storefront traffic generator for demos.
# Sends ~2 rps: a mix of catalog browses and authenticated checkouts.
# Run in the background; kill the PID to stop.
#
#   bash demos/scripts/load-gen.sh <gateway-ip>

GATEWAY="${1:?usage: load-gen.sh <gateway-ip>}"
SLEEP="${SLEEP:-0.5}"

while true; do
  # 1. List products (unauthenticated)
  curl -sf "http://${GATEWAY}/api/products" >/dev/null 2>&1 || true

  # 2. Login and checkout (authenticated)
  TOKEN="$(curl -sf -XPOST "http://${GATEWAY}/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"demo-load"}' 2>/dev/null \
    | sed -E 's/.*"access_token":"([^"]+)".*/\1/' 2>/dev/null || true)"

  if [[ -n "${TOKEN}" ]]; then
    # Randomise which SKU and quantity to keep metrics varied.
    SKU="SKU-MUG"
    QTY=$((RANDOM % 3 + 1))
    curl -sf -XPOST "http://${GATEWAY}/api/checkout" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d "{\"items\":[{\"sku\":\"${SKU}\",\"qty\":${QTY}}]}" >/dev/null 2>&1 || true
  fi

  sleep "${SLEEP}"
done
