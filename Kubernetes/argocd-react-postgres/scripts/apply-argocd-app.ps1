\
    param(
      [Parameter(Mandatory=$true)][string]$Owner,
      [Parameter(Mandatory=$true)][string]$Repo
    )
    # Replaces OWNER/REPO placeholders and applies the Argo CD Application

    $appFile = "argocd\application-dev.yaml"
    (Get-Content $appFile) `
      -replace "https://github.com/OWNER/REPO.git", "https://github.com/$Owner/$Repo.git" `
      | Set-Content $appFile

    $files = @(
      "k8s\base\api-deployment.yaml",
      "k8s\base\web-deployment.yaml",
      "k8s\base\kustomization.yaml",
      "k8s\overlays\dev\kustomization.yaml",
      ".github\workflows\cicd.yaml"
    )
    foreach ($f in $files) {
      (Get-Content $f) `
        -replace "ghcr.io/OWNER/REPO", "ghcr.io/$Owner/$Repo" `
        -replace "IMAGE_NAMESPACE: OWNER", "IMAGE_NAMESPACE: $Owner" `
        -replace "IMAGE_REPO: REPO", "IMAGE_REPO: $Repo" `
        | Set-Content $f
    }

    Write-Host "Applying Argo CD Application (demo-dev)..."
    kubectl apply -f $appFile

    Write-Host "Done. Push to 'main' to trigger CI, build images, and auto-sync."
