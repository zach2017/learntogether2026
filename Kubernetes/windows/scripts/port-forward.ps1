<#
.SYNOPSIS
  Port-forward localhost:8080 -> hello-svc:80 in the 'lesson' namespace.
#>

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl

Write-Host "==> Port-forwarding 8080 -> hello-svc:80 (Ctrl+C to stop)..." -ForegroundColor Cyan
kubectl -n lesson port-forward svc/hello-svc 8080:80