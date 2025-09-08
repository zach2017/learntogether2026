<#
.SYNOPSIS
  Install Argo CD in 'argocd' namespace via official manifests.
#>
$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found."
  }
}

Assert-Command kubectl

Write-Host "==> Creating namespace 'argocd'..." -ForegroundColor Cyan
kubectl create namespace argocd 2>$null | Out-Null

Write-Host "==> Installing Argo CD (stable manifests)..." -ForegroundColor Cyan
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

Write-Host "==> Waiting for pods..." -ForegroundColor Cyan
kubectl -n argocd rollout status deploy/argocd-server --timeout=180s
kubectl -n argocd get pods -o wide
