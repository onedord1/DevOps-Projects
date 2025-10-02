#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
NAMESPACE=${2:-expense-tracker}

echo "🚀 Deploying to ${ENVIRONMENT} environment in namespace ${NAMESPACE}..."

kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -k overlays/${ENVIRONMENT} -n ${NAMESPACE}

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n ${NAMESPACE}

echo "✅ Deployment completed successfully!"
