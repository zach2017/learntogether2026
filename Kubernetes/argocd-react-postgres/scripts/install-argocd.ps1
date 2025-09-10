\
    # Installs Argo CD into 'argocd' namespace and prints admin password.
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    kubectl apply -n argocd `
      -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    Write-Host "Waiting for Argo CD server to be ready..."
    kubectl rollout status deploy/argocd-server -n argocd --timeout=180s

    $pwd = kubectl -n argocd get secret argocd-initial-admin-secret `
      -o jsonpath="{.data.password}" | %{ [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }

    Write-Host "`nArgo CD admin password:"
    Write-Host $pwd

    Write-Host "`nPort-forwarding Argo CD UI to https://localhost:8080 (Ctrl+C to stop)..."
    Write-Host "Login with 'admin' / the password above."
    kubectl port-forward svc/argocd-server -n argocd 8080:443
