<#
.SYNOPSIS
  Port-forward localhost:8080 -> argocd-server:443 for UI access.
#>
$ErrorActionPreference = "Stop"

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
  throw "kubectl is required."
}

Write-Host "==> Port-forwarding https://localhost:8080 (Ctrl+C to stop)..." -ForegroundColor Cyan
kubectl -n argocd port-forward svc/argocd-server 8080:443
