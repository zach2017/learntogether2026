#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="${SCRIPT_DIR}/../applications"
kubectl apply -f "${APPS_DIR}/approject-lesson.yaml"
kubectl apply -f "${APPS_DIR}/application-guestbook.yaml"
kubectl -n argocd get applications
