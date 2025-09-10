# Argo CD Intro (Windows) — React + Node API + Postgres

This repo demonstrates GitOps with **Argo CD** using a simple React frontend, Node/Express API, and Postgres DB.
CI builds Docker images with **GitHub Actions**, pushes to **GHCR**, updates Kustomize image tags, and Argo CD auto-syncs the cluster.

## Prereqs (Windows)
- **Docker Desktop** installed
  - Option A: Enable Docker Desktop's built-in Kubernetes (Settings → Kubernetes → Enable).
  - Option B: Install **minikube** and use Docker as the driver.
- **kubectl** in PATH.
- **(Optional)** **minikube** in PATH if you prefer it over Docker Desktop K8s.
- A GitHub repo for this code and GHCR enabled.

## Quick Start (minikube path)
No worries—let’s switch to **KIND** on Windows. You’ve got two paths:

---

# A) One-time install + quick commands (no scripts needed)

1. Install the tools (choose one package manager):

**Chocolatey (Admin PowerShell):**

```powershell
choco install -y kind kubernetes-cli
```

**Scoop (PowerShell):**

```powershell
scoop install kind kubectl
```

2. Create a KIND cluster that exposes NodePort **30080** to your host:

* Download my KIND add-ons and unzip into your project root:

  * [Download KIND add-ons](sandbox:/mnt/data/argocd-kind-addons.zip)

* Then run:

```powershell
kind create cluster --name argo-dev --config .\kind\cluster.yaml
kubectl get nodes -o wide
```

3. Install Argo CD + open the UI:

```powershell
kubectl create namespace argocd
kubectl apply -n argocd `
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl rollout status deploy/argocd-server -n argocd --timeout=180s

# Get admin password, then port-forward UI to https://localhost:8080
kubectl -n argocd get secret argocd-initial-admin-secret ` -o jsonpath="{.data.password}" | base64 -d ; echo
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

4. Point Argo CD at your repo (update OWNER/REPO as before) and apply `argocd\application-dev.yaml`.

5. Push to `main` → GitHub Actions builds/pushes images → updates overlay tags → Argo CD syncs.

6. Open the app:

```powershell
# Thanks to the extraPortMappings in kind/cluster.yaml:
Start-Process http://localhost:30080
Invoke-WebRequest http://localhost:30080/api/hello | Select-Object -Expand Content
```

> If you prefer not to use NodePort, you can port-forward instead:
>
> ```powershell
> kubectl port-forward svc/web -n demo 8080:80
> # then browse http://localhost:8080
> ```

---

# B) Use helper scripts (if your policy allows signed scripts)

The add-ons zip includes:

* `kind/cluster.yaml` – maps NodePort 30080 → host 30080
* `scripts/start-kind.ps1` – creates the cluster
* `scripts/port-forward-web.ps1` – quick port-forward fallback
* `README-KIND.md` – step-by-step KIND guide

Run:

```powershell
# If you're under AllSigned, sign the scripts first (as we covered)
.\scripts\start-kind.ps1
```

---

## Why you saw the error

`minikube` wasn’t installed, and your environment enforces **AllSigned**, which blocks unsigned `.ps1`. Using the **direct kind commands above avoids scripts entirely**, or you can self-sign the helper scripts using the steps I gave earlier.

If anything fails, paste the exact command + output and I’ll troubleshoot fast.



```powershell
# Start minikube with NodePort access
.\scripts\start-minikube.ps1

# Install Argo CD (non-HA)
.\scripts\install-argocd.ps1

# Edit placeholders for OWNER/REPO and apply Argo Application
.\scripts\apply-argocd-app.ps1 -Owner YOUR_GH_USER_OR_ORG -Repo YOUR_REPO_NAME
```

After the first successful GitHub Actions run on `main`, Argo CD will sync and roll out the app.

## GHCR & GitHub Actions
- The workflow uses `${{ secrets.GITHUB_TOKEN }}` to push to GHCR.
- Make sure GH Packages is enabled for your account/org.
- Update `IMAGE_NAMESPACE` and `IMAGE_REPO` in `.github/workflows/cicd.yaml`.

## Testing the app (NodePort 30080)
```powershell
# If using minikube on Windows with Docker driver, localhost should work:
Invoke-WebRequest http://localhost:30080/api/hello | Select-Object -ExpandProperty Content
Start-Process http://localhost:30080
```

## Troubleshooting
- **Images won't pull**: If your repo is private, set up an imagePullSecret and reference it in the deployments.
- **Argo CD not syncing**: Confirm CI committed a new `k8s/overlays/dev/kustomization.yaml` change (new SHA tag).
- **NodePort not reachable**: On some setups, use `minikube service web -n demo --url`.
- **Postgres CrashLoopBackOff**: Check secret `db-secret` and pod logs.
