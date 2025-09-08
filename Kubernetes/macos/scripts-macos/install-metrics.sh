#!/usr/bin/env bash
# Install Metrics Server via Helm for local dev and apply HPA.

set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }
info() { printf "\033[36m==> %s\033[0m\n" "$*"; }

need kubectl
if ! command -v helm >/dev/null 2>&1; then
  echo "Helm not found. Install with: brew install helm"
  exit 1
fi

info "Installing Metrics Server (with --kubelet-insecure-tls for local dev)..."
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ >/dev/null
helm repo update >/dev/null
helm upgrade --install metrics-server metrics-server/metrics-server -n kube-system \
  --set args[0]="--kubelet-insecure-tls"

info "Waiting for metrics..."
sleep 8
kubectl top nodes || true
kubectl top pods -A || true

K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"
info "Applying HPA..."
kubectl apply -f "${K8S_DIR}/06-hpa.yaml"

info "HPA installed. Generate load (e.g., 'brew install hey' then 'hey -z 30s http://localhost:8080/api/hello')."
