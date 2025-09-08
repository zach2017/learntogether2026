<#
.SYNOPSIS
  Apply PV/PVC, Job, and CronJob for the demo.
#>

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl

Push-Location "$PSScriptRoot\..\k8s"
Write-Host "==> Applying PV/PVC..." -ForegroundColor Cyan
kubectl apply -f 07-pv-pvc.yaml

Write-Host "==> Applying Job..." -ForegroundColor Cyan
kubectl apply -f 08-job.yaml

Write-Host "==> Applying CronJob..." -ForegroundColor Cyan
kubectl apply -f 09-cronjob.yaml

Pop-Location

Write-Host "==> Done. Check: 'kubectl get jobs -n lesson', 'kubectl get cronjobs -n lesson'." -ForegroundColor Green