<#
.SYNOPSIS
  Remove demo resources and optional components.
#>

param(
  [switch]$RemoveIngress = $true,
  [switch]$RemoveMetrics = $true
)

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl

Write-Host "==> Deleting namespace 'lesson'..." -ForegroundColor Cyan
kubectl delete ns lesson --ignore-not-found

if ($RemoveIngress) {
  if (Get-Command helm -ErrorAction SilentlyContinue) {
    Write-Host "==> Uninstalling ingress-nginx..." -ForegroundColor Cyan
    helm uninstall ingress-nginx -n ingress-nginx 2>$null | Out-Null
    kubectl delete ns ingress-nginx --ignore-not-found
  }
}

if ($RemoveMetrics) {
  if (Get-Command helm -ErrorAction SilentlyContinue) {
    Write-Host "==> Uninstalling metrics-server..." -ForegroundColor Cyan
    helm uninstall metrics-server -n kube-system 2>$null | Out-Null
  }
}

Write-Host "==> Cleanup complete." -ForegroundColor Green