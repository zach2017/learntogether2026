#!/usr/bin/env bash
set -euo pipefail
echo "Port-forwarding https://localhost:8080 (Ctrl+C to stop)..."
kubectl -n argocd port-forward svc/argocd-server 8080:443
