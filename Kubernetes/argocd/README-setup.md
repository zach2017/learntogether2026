# Argo CD Lesson: GitOps from Zero to Sync

This lesson gets you from *no Argo CD* to a working **GitOps** deployment using
the official example app. It includes Windows/macOS helper scripts, ready-made
**Application** manifests, and a clear **what & why** walkthrough.

> Works great on Docker Desktop (Windows/macOS) with Kubernetes enabled, or kind/minikube.

---

## Learning Objectives
1. Install Argo CD correctly and access its UI.
2. Retrieve the initial `admin` password and log in.
3. Understand and apply an **Application** CR that tracks a Git repo path.
4. Trigger **sync**, watch status/health, and understand auto-sync and pruning.
5. (Optional) Use **port-forward** vs. **NodePort** exposures.
6. (Optional) Use **AppProject** and **App of Apps** patterns.

---

## Prerequisites
- A working local cluster (`kubectl get nodes` shows `Ready`).
- `kubectl` in your PATH.
- Internet access to pull Argo CD installation manifests and example app.

---

## Quickstart (Windows PowerShell)
From the project root:
```powershell
# 1) Install Argo CD and port-forward the UI
./scripts-windows/install-argocd.ps1
./scripts-windows/port-forward-ui.ps1

# 2) Get the initial admin password
./scripts-windows/get-admin-password.ps1

# 3) Apply our sample Application (guestbook from argoproj examples)
./scripts-windows/apply-guestbook.ps1

# 4) Open the UI:
#    https://localhost:8080  (ignore TLS warning for local dev)
#    Username: admin
#    Password: (from get-admin-password.ps1)
```

## Quickstart (macOS / zsh or bash)
```bash
# 1) Install Argo CD and port-forward the UI
./scripts-macos/install-argocd.sh
./scripts-macos/port-forward-ui.sh

# 2) Get the initial admin password
./scripts-macos/get-admin-password.sh

# 3) Apply our sample Application
./scripts-macos/apply-guestbook.sh

# 4) Open the UI:
#    https://localhost:8080
#    Username: admin
#    Password: (from get-admin-password.sh)
```

---

## What & Why (Key Bits)

- **Argo CD** keeps your **cluster state** in sync with a **Git repo** (GitOps). You **declare** the desired state in Git; Argo CD reconciles continuously.
- **Application CRD** tells Argo CD *which repo/path/target revision* to track, *where to deploy* (destination cluster/namespace), and *how to sync* (manual/auto, prune, self-heal).
- **Port-forward** lets you reach the Argo CD UI quickly without touching Service types. **NodePort** is optional for a stable local port.
- **Initial admin password** is stored in `argocd-initial-admin-secret` (base64-encoded). You should rotate/change it immediately after first login.
- **Sync modes**: Manual (click Sync) vs. Automated (Argo CD detects changes and applies them). Add **prune** to remove resources deleted from Git.

---

## Files in this lesson

```
argocd-lesson/
├─ applications/
│  ├─ application-guestbook.yaml     # tracks argocd example repo
│  ├─ approject-lesson.yaml          # restricts destinations/repos (example)
│  └─ app-of-apps.yaml               # demonstrates App of Apps pattern (optional)
├─ scripts-windows/                  # PowerShell helpers
└─ scripts-macos/                    # macOS bash/zsh helpers
```

---

## Clean Up
```powershell
# Windows
./scripts-windows/cleanup.ps1
```
```bash
# macOS
./scripts-macos/cleanup.sh
```

---

## Troubleshooting
- **UI not reachable**: Ensure `port-forward` terminal is running. Use `kubectl -n argocd get svc,pods`.
- **Pods CrashLoopBackOff**: Check `kubectl -n argocd logs deploy/argocd-server`.
- **Permission denied syncing app**: Confirm the repo URL is accessible and your cluster destination is correct.
- **TLS warnings** on https://localhost:8080 are expected for local self-signed certs.
