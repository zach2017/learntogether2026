# Kubernetes Lesson (macOS + Docker Desktop)

This guide is **macOS-only** and assumes **Docker Desktop with Kubernetes enabled**.

---

## 1. Prerequisites

1) Install **Docker Desktop for Mac** and enable **Kubernetes**: Docker Desktop → **Settings → Kubernetes → Enable Kubernetes** → **Apply & Restart**.  
2) Verify:
```bash
kubectl version --client
kubectl config current-context   # docker-desktop
kubectl get nodes                # Ready
```

(Optional) Install **Helm** and **hey** (for load testing):
```bash
brew install helm hey
```

---

## 2. Build the App Image

```bash
cd kubernetes-lesson/app
docker build -t hello-k8s:1.0.0 .
```

*Why*: Build the Node.js API image locally so the Docker Desktop K8s cluster can run it immediately.

---

## 3. Deploy Core Resources

```bash
# from project root
./scripts-macos/start.sh
# or with custom image name/tag:
# ./scripts-macos/start.sh myapp 0.1.0
```

*What & Why*: Namespace (isolation), ConfigMap/Secret (12-factor config), Deployment (replicas/rollouts), Service (stable cluster IP).

---

## 4. Test the Service

```bash
./scripts-macos/port-forward.sh
# in a second terminal:
curl http://localhost:8080/health
curl http://localhost:8080/api/hello
```

---

## 5. Autoscaling (HPA) with Metrics Server

```bash
./scripts-macos/install-metrics.sh
kubectl top pods -n lesson
```

*Why*: HPA needs resource metrics; for local clusters we pass `--kubelet-insecure-tls` to accommodate self-signed kubelet certs.

---

## 6. Optional: Ingress Controller (ingress-nginx)

```bash
./scripts-macos/install-ingress.sh 30080
curl http://hello.localtest.me:30080/api/hello
```

*Why*: Ingress provides a single HTTP(S) entry point with host/path routing. `localtest.me` resolves to 127.0.0.1, so no /etc/hosts edit is needed.

---

## 7. Storage, Jobs, CronJobs

```bash
./scripts-macos/jobs-and-storage.sh
```

*Why*: Demonstrates PV/PVC basics and batch/scheduled workloads.

---

## 8. Status & Cleanup

```bash
./scripts-macos/status.sh
./scripts-macos/cleanup.sh          # also removes ingress-nginx and metrics-server
./scripts-macos/cleanup.sh false    # keep ingress-nginx & metrics-server
```

---

## Notes

- Docker Desktop’s Kubernetes is a great dev sandbox. For production, use managed clusters and real storage classes/ingress controllers (not hostPath/NodePort).
- If you switch contexts (e.g., to a cloud cluster), re-run: `kubectl config current-context` to confirm you’re targeting the right cluster.
