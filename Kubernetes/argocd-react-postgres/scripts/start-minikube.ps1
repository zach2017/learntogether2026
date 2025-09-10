\
    param(
      [switch]$CPUSmall
    )
    # Starts minikube with Docker driver on Windows and enables ingress if needed.
    $cpus = if ($CPUSmall) { 2 } else { 4 }
    $memory = if ($CPUSmall) { "3g" } else { "6g" }
    Write-Host "Starting minikube with $cpus CPUs and $memory memory..."
    minikube start --driver=docker --cpus $cpus --memory $memory

    Write-Host "minikube status:"
    minikube status

    Write-Host "Enabling ingress addon (optional)"
    minikube addons enable ingress | Out-Null

    Write-Host "Kubernetes nodes:"
    kubectl get nodes -o wide
