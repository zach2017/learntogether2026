#!/usr/bin/env bash
set -euo pipefail
if ! command -v argocd >/dev/null 2>&1; then
  echo "Installing argocd CLI with Homebrew..."
  brew install argocd
fi
argocd version || true
