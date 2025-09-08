#!/usr/bin/env bash
# Remove demo resources and optional components.

set -euo pipefail

REMOVE_INGRESS="${1:-true}"
REMOVE_METRICS="${2:-true}"

command -v kubectl >/dev/null 2>&1 || { echo "Missing: kubectl"; exit 1; }

echo "Deleting namespace 'lesson'..."
kubectl delete ns lesson --ignore-not-found

if [[ "${REMOVE_INGRESS}" == "true" ]]; then
  if command -v helm >/dev/null 2>&1; then
    echo "Uninstalling ingress-nginx..."
    helm uninstall ingress-nginx -n ingress-nginx >/dev/null 2>&1 || true
    kubectl delete ns ingress-nginx --ignore-not-found
  fi
fi

if [[ "${REMOVE_METRICS}" == "true" ]]; then
  if command -v helm >/dev/null 2>&1; then
    echo "Uninstalling metrics-server..."
    helm uninstall metrics-server -n kube-system >/dev/null 2>&1 || true
  fi
fi

echo "Cleanup complete."
