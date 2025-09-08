#!/usr/bin/env bash
set -euo pipefail
kubectl delete application --all -n argocd || true
kubectl delete appproject lesson -n argocd || true
kubectl delete ns argocd --ignore-not-found
kubectl delete ns lesson-guestbook --ignore-not-found
