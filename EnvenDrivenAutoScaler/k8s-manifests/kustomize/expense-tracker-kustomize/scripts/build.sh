#!/bin/bash
# scripts/build.sh (FINAL WORKING VERSION)

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT=${1:-development}
OUTPUT_DIR="${PROJECT_ROOT}/dist/${ENVIRONMENT}"
OVERLAY_DIR="${PROJECT_ROOT}/overlays/${ENVIRONMENT}"
VALIDATE=${2:-auto}  # Options: auto, true, false

echo "🏗️  Building manifests for ${ENVIRONMENT} environment..."
echo "📁 Script directory: ${SCRIPT_DIR}"
echo "📁 Project root: ${PROJECT_ROOT}"
echo "📁 Overlay directory: ${OVERLAY_DIR}"
echo "📁 Output directory: ${OUTPUT_DIR}"
echo "🔍 Validation mode: ${VALIDATE}"

# Check if overlay directory exists
if [ ! -d "${OVERLAY_DIR}" ]; then
    echo "❌ Overlay directory does not exist: ${OVERLAY_DIR}"
    exit 1
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Define manifest file
MANIFEST_FILE="${OUTPUT_DIR}/manifests.yaml"

# Remove existing file to ensure clean build
rm -f "${MANIFEST_FILE}"

# Build manifests using tee (this works reliably)
echo "📦 Building manifests..."
if command -v kustomize &> /dev/null; then
    if kustomize build --help > /dev/null 2>&1; then
        echo "🔧 Using: kustomize build ${OVERLAY_DIR}"
        kustomize build "${OVERLAY_DIR}" | tee "${MANIFEST_FILE}" > /dev/null
    else
        echo "🔧 Using: kustomize ${OVERLAY_DIR}"
        kustomize "${OVERLAY_DIR}" | tee "${MANIFEST_FILE}" > /dev/null
    fi
else
    echo "🔧 Using: kubectl kustomize ${OVERLAY_DIR}"
    kubectl kustomize "${OVERLAY_DIR}" | tee "${MANIFEST_FILE}" > /dev/null
fi

# Check if file was created and has content
if [ ! -f "${MANIFEST_FILE}" ] || [ ! -s "${MANIFEST_FILE}" ]; then
    echo "❌ Failed to create manifest file or file is empty!"
    exit 1
fi

echo "✅ Manifest file created successfully!"
echo "📊 File size: $(wc -c < "${MANIFEST_FILE}") bytes"
echo "📊 Line count: $(wc -l < "${MANIFEST_FILE}") lines"

# Show first few lines
echo "📄 First few lines of manifests:"
head -20 "${MANIFEST_FILE}"

# Validate manifests based on mode
if [ "${VALIDATE}" != "false" ]; then
    echo "🔍 Validating manifests..."
    if command -v kubectl; then
        if [ "${VALIDATE}" = "false" ] || ([ "${VALIDATE}" = "auto" ] && ! kubectl cluster-info &> /dev/null); then
            echo "⚠️  Skipping server validation (cluster not reachable or validation disabled)"
            kubectl apply --dry-run=client --validate=false -f "${MANIFEST_FILE}"
        else
            echo "🔗 Validating with cluster..."
            kubectl apply --dry-run=client -f "${MANIFEST_FILE}"
        fi
    else
        echo "⚠️  kubectl not found, skipping validation"
    fi
fi

echo "✅ Build completed successfully!"
echo "📁 Output directory: ${OUTPUT_DIR}"
echo "📄 Manifests: ${MANIFEST_FILE}"
echo "📊 File size: $(wc -c < "${MANIFEST_FILE}") bytes"
echo "📊 Line count: $(wc -l < "${MANIFEST_FILE}") lines"