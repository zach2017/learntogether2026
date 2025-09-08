<#
.SYNOPSIS
  Show current status of resources in the 'lesson' namespace.
#>

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found. Please install it and re-run."
  }
}

Assert-Command kubectl

kubectl get all -n lesson
kubectl get ingress -n lesson
kubectl get hpa -n lesson
kubectl get pvc,pv -n lesson