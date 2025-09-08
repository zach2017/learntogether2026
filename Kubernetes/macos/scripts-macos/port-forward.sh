#!/usr/bin/env bash
# Port-forward localhost:8080 -> hello-svc:80 in the 'lesson' namespace.

set -euo pipefail

command -v kubectl >/dev/null 2>&1 || { echo "Missing: kubectl"; exit 1; }

echo "Port-forwarding 8080 -> hello-svc:80 (Ctrl+C to stop) ..."
kubectl -n lesson port-forward svc/hello-svc 8080:80
