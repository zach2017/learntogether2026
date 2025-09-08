<#
.SYNOPSIS
  Install ingress-nginx via Helm (NodePort 30080) and apply the demo Ingress.
#>

param(
  [int]$HttpNodePort = 30080
)

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl
Assert-Command helm

Write-Host "==> Installing ingress-nginx (NodePort:$HttpNodePort) ..." -ForegroundColor Cyan
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx | Out-Null
helm repo update | Out-Null
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  -n ingress-nginx --create-namespace `
  --set controller.service.type=NodePort `
  --set controller.service.nodePorts.http=$HttpNodePort

Write-Host "==> Applying demo Ingress..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\k8s"
kubectl apply -f 05-ingress.yaml
Pop-Location

Write-Host "==> Test with: curl http://hello.localtest.me:$HttpNodePort/api/hello" -ForegroundColor Green