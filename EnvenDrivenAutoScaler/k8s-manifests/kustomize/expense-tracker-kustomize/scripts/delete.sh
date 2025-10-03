#!/bin/bash
# scripts/delete.sh (Fixed Version)

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT=${1:-development}
NAMESPACE=${2:-expense-tracker}
OVERLAY_DIR="${PROJECT_ROOT}/overlays/${ENVIRONMENT}"

echo "🗑️  Deleting ${ENVIRONMENT} environment from namespace ${NAMESPACE}..."

# Check if overlay directory exists
if [ ! -d "${OVERLAY_DIR}" ]; then
    echo "❌ Overlay directory does not exist: ${OVERLAY_DIR}"
    exit 1
fi

# Delete manifests
echo "🗑️  Deleting manifests..."
if command -v kustomize &> /dev/null; then
    kustomize build "${OVERLAY_DIR}" | kubectl delete -f - -n ${NAMESPACE} --ignore-not-found=true
else
    kubectl delete -k "${OVERLAY_DIR}" -n ${NAMESPACE} --ignore-not-found=true
fi

echo "✅ Deletion completed successfully!"