# 📋 Quick Reference Commands

## Build and deploy production
./scripts/build.sh production && ./scripts/deploy.sh production

## Delete development
./scripts/delete.sh development

## Delete production
./scripts/delete.sh production

## Preview changes
kustomize build overlays/production | diff -u dist/production/manifests.yaml -