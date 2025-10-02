#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
OUTPUT_DIR="dist/${ENVIRONMENT}"

echo "🏗️  Building manifests for ${ENVIRONMENT} environment..."

mkdir -p ${OUTPUT_DIR}

kustomize build overlays/${ENVIRONMENT} > ${OUTPUT_DIR}/manifests.yaml

echo "🔍 Validating manifests..."
kubectl apply --dry-run=client -f ${OUTPUT_DIR}/manifests.yaml

echo "✅ Build completed successfully!"
echo "📁 Output directory: ${OUTPUT_DIR}"
echo "📄 Manifests: ${OUTPUT_DIR}/manifests.yaml"
