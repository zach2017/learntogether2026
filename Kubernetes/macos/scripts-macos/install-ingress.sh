#!/usr/bin/env bash
# Install ingress-nginx via Helm (NodePort 30080) and apply the demo Ingress.

set -euo pipefail

HTTP_NODEPORT="${1:-30080}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }
info() { printf "\033[36m==> %s\033[0m\n" "$*"; }

need kubectl
if ! command -v helm >/dev/null 2>&1; then
  echo "Helm not found. Install with: brew install helm"
  exit 1
fi

info "Installing ingress-nginx (NodePort:${HTTP_NODEPORT}) ..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null
helm repo update >/dev/null
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http="${HTTP_NODEPORT}"

K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"
info "Applying demo Ingress ..."
kubectl apply -f "${K8S_DIR}/05-ingress.yaml"

info "Test with: curl http://hello.localtest.me:${HTTP_NODEPORT}/api/hello"
