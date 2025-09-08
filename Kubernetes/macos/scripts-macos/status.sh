#!/usr/bin/env bash
# Show current status of resources in the 'lesson' namespace.

set -euo pipefail

command -v kubectl >/dev/null 2>&1 || { echo "Missing: kubectl"; exit 1; }

kubectl get all -n lesson
kubectl get ingress -n lesson || true
kubectl get hpa -n lesson || true
kubectl get pvc,pv -n lesson || true
