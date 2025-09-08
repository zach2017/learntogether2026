<#
.SYNOPSIS
  Remove Argo CD and lesson namespaces/apps.
#>
$ErrorActionPreference = "Stop"
kubectl delete application --all -n argocd 2>$null | Out-Null
kubectl delete appproject lesson -n argocd 2>$null | Out-Null
kubectl delete ns argocd --ignore-not-found
kubectl delete ns lesson-guestbook --ignore-not-found
