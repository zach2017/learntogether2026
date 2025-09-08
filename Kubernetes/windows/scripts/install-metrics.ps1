<#
.SYNOPSIS
  Install Metrics Server via Helm for local dev and apply HPA.
#>

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl
Assert-Command helm

Write-Host "==> Installing Metrics Server (with kubelet-insecure-tls for local dev)..." -ForegroundColor Cyan
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ | Out-Null
helm repo update | Out-Null
helm upgrade --install metrics-server metrics-server/metrics-server -n kube-system `
  --set args[0]="--kubelet-insecure-tls"

Write-Host "==> Waiting for Metrics to become available..." -ForegroundColor Cyan
Start-Sleep -Seconds 8
kubectl top nodes
kubectl top pods -A

Write-Host "==> Applying HPA..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\k8s"
kubectl apply -f 06-hpa.yaml
Pop-Location

Write-Host "==> HPA installed. Generate load to see scaling (e.g., 'hey' or 'wrk')." -ForegroundColor Green