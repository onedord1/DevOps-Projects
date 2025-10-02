#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
NAMESPACE=${2:-expense-tracker}

echo "🗑️  Deleting ${ENVIRONMENT} environment from namespace ${NAMESPACE}..."

kubectl delete -k overlays/${ENVIRONMENT} -n ${NAMESPACE} --ignore-not-found=true

echo "✅ Deletion completed successfully!"
