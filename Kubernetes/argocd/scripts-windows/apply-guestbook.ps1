<#
.SYNOPSIS
  Applies the AppProject and Application (guestbook) for the lesson.
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apps = Join-Path (Split-Path -Parent $root) "applications"

kubectl apply -f "$apps\approject-lesson.yaml"
kubectl apply -f "$apps\application-guestbook.yaml"
kubectl -n argocd get applications
