<#
.SYNOPSIS
  Patch argocd-server Service to NodePort (HTTP:30090).
#>
$ErrorActionPreference = "Stop"
kubectl -n argocd patch svc argocd-server -p @"
{
  "spec": {
    "type": "NodePort",
    "ports": [
      { "name": "http", "port": 80, "targetPort": 8080, "nodePort": 30090 }
    ]
  }
}
"@
kubectl -n argocd get svc argocd-server
Write-Host "Access UI at: http://localhost:30090" -ForegroundColor Green
