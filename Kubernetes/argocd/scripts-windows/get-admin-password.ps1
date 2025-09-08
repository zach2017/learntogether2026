<#
.SYNOPSIS
  Prints the initial 'admin' password.
#>
$ErrorActionPreference = "Stop"
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
  throw "kubectl is required."
}
kubectl -n argocd get secret argocd-initial-admin-secret `
  -o jsonpath="{.data.password}" | %{ [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
Write-Host ""
