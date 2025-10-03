#!/bin/bash
# scripts/deploy.sh (Updated for New Kustomize)

set -e

# Change to project root directory
cd "$(dirname "$0")/.."

ENVIRONMENT=${1:-development}
NAMESPACE=${2:-expense-tracker}

echo "🚀 Deploying to ${ENVIRONMENT} environment in namespace ${NAMESPACE}..."

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster!"
    exit 1
fi

# Create namespace if it doesn't exist
echo "📝 Creating namespace ${NAMESPACE}..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Deploy manifests
echo "🚀 Applying manifests..."
if command -v kustomize &> /dev/null; then
    if kustomize build --help > /dev/null 2>&1; then
        kustomize build "overlays/${ENVIRONMENT}" | kubectl apply -f - -n ${NAMESPACE}
    else
        kustomize "overlays/${ENVIRONMENT}" | kubectl apply -f - -n ${NAMESPACE}
    fi
else
    kubectl apply -k "overlays/${ENVIRONMENT}" -n ${NAMESPACE}
fi

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n ${NAMESPACE} --ignore-not-found=true

echo "✅ Deployment completed successfully!"
echo "🔍 Check status with: kubectl get all -n ${NAMESPACE}"