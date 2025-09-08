#!/usr/bin/env bash
# Build the demo image and deploy core K8s resources on Docker Desktop (macOS).

set -euo pipefail

IMAGE_NAME="${1:-hello-k8s}"
IMAGE_TAG="${2:-1.0.0}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }
info() { printf "\033[36m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[33m[warn] %s\033[0m\n" "$*"; }

need docker
need kubectl

CTX="$(kubectl config current-context || true)"
if [[ "$CTX" != "docker-desktop" ]]; then
  warn "kubectl context is '$CTX', expected 'docker-desktop'. Continuing."
fi

# Build image
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app" && pwd)"
info "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG} ..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" "$APP_DIR"

# Apply K8s manifests
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"
info "Applying Namespace/Config/Secret/Deployment/Service ..."
kubectl apply -f "${K8S_DIR}/00-namespace.yaml"
kubectl apply -f "${K8S_DIR}/01-configmap.yaml"
kubectl apply -f "${K8S_DIR}/02-secret.yaml"

DEPLOY_FILE="${K8S_DIR}/03-deployment.yaml"
if [[ "${IMAGE_NAME}:${IMAGE_TAG}" != "hello-k8s:1.0.0" ]]; then
  tmp="$(mktemp)"
  sed -E "s|image:\s*hello-k8s:1\.0\.0|image: ${IMAGE_NAME}:${IMAGE_TAG}|g" "$DEPLOY_FILE" > "$tmp"
  kubectl apply -f "$tmp"
  rm -f "$tmp"
else
  kubectl apply -f "$DEPLOY_FILE"
fi

kubectl apply -f "${K8S_DIR}/04-service.yaml"

info "Done. Use './port-forward.sh' to test locally."
