<#
.SYNOPSIS
  Build the demo image and deploy core K8s resources on Docker Desktop (Windows).
#>

param(
  [string]$ImageName = "hello-k8s",
  [string]$ImageTag = "1.0.0"
)

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Write-Host "==> Preflight checks..." -ForegroundColor Cyan
Assert-Command docker
Assert-Command kubectl

# Verify context
$ctx = (kubectl config current-context)
if ($ctx -ne "docker-desktop") {
  Write-Warning "kubectl context is '$ctx', expected 'docker-desktop'. Continuing, but make sure this is the right cluster."
}

# Build image
Write-Host "==> Building Docker image $ImageName:$ImageTag ..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\app"
docker build -t "$ImageName:$ImageTag" .
Pop-Location

# Deploy K8s manifests
Push-Location "$PSScriptRoot\..\k8s"
Write-Host "==> Applying Namespace/Config/Secret/Deployment/Service..." -ForegroundColor Cyan
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secret.yaml

# Patch deployment image/tag if needed
if ($ImageName -ne "hello-k8s" -or $ImageTag -ne "1.0.0") {
  # Create a temp copy with updated image
  $deploy = Get-Content 03-deployment.yaml -Raw
  $deploy = $deploy -replace "image:\s*hello-k8s:1.0.0", "image: $ImageName:$ImageTag"
  $tmp = Join-Path $env:TEMP "03-deployment.tmp.yaml"
  $deploy | Set-Content $tmp -NoNewline
  kubectl apply -f $tmp
  Remove-Item $tmp -Force
} else {
  kubectl apply -f 03-deployment.yaml
}

kubectl apply -f 04-service.yaml

Write-Host "==> Done. Use 'port-forward.ps1' to test the service locally." -ForegroundColor Green
Pop-Location