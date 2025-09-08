Awesome—here’s a **Windows-first, Docker Desktop + Kubernetes** walkthrough that uses the sample you downloaded (`kubernetes-lesson.zip`). I’ll give you the **exact steps** plus the **why** for each one.

---

# 1) Install & turn on Docker Desktop + Kubernetes (Windows)

**Steps**

1. Install **WSL 2** (Windows Subsystem for Linux):
   Open **PowerShell (Admin)** →

   ```ps1
   wsl --install
   ```

   Restart if asked. ([Microsoft Learn][1])
2. Install **Docker Desktop for Windows** and ensure **WSL 2 backend** is enabled (Docker Desktop → Settings → **Resources > WSL Integration**). ([Docker Documentation][2])
3. Enable **Kubernetes** (Docker Desktop → Settings → **Kubernetes** → check **Enable Kubernetes**, then **Apply & Restart**).
   On recent versions you can pick the **kind** provisioner for multi-node local clusters. ([Docker Documentation][3], [Docker][4])
4. Verify from a new terminal (PowerShell or Git Bash):

   ```bash
   kubectl version --client
   kubectl config current-context   # should be: docker-desktop
   kubectl get nodes                # Ready   control-plane
   ```

**Why**

* **WSL 2** gives you a Linux kernel on Windows—Docker Desktop relies on it for Linux containers. ([Microsoft Learn][5])
* **Enable Kubernetes** spins up a local, single (or multi) node cluster that’s perfect for dev/test. ([Docker Documentation][3])

---

# 2) Unzip the lesson & build the app image

**Steps**

1. Unzip `kubernetes-lesson.zip`.
2. Build the example API image:

   ```bash
   cd kubernetes-lesson/app
   docker build -t hello-k8s:1.0.0 .
   ```

**Why**

* Docker Desktop’s Kubernetes uses the same Docker engine, so **locally built images** like `hello-k8s:1.0.0` are directly usable by the cluster (no push/pull required).

---

# 3) Apply the core Kubernetes objects

**Steps**

```bash
cd ../k8s
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secret.yaml
kubectl apply -f 03-deployment.yaml
kubectl apply -f 04-service.yaml
```

**Why (object-by-object)**

* **Namespace** (`lesson`): isolates this app cleanly from default workloads.
* **ConfigMap**: non-secret settings (e.g., `CONFIG_VALUE`) you can change without rebuilding the image.
* **Secret**: sensitive values (e.g., API keys).
* **Deployment**: desired state (**2 replicas**) and rolling updates.
* **Service (ClusterIP)**: stable virtual IP for pods—internal cluster networking.

---

# 4) Quick test without Ingress (fastest dev loop)

**Steps**

```bash
kubectl -n lesson port-forward svc/hello-svc 8080:80
# New terminal:
curl http://localhost:8080/health
curl http://localhost:8080/api/hello
```

**Why**

* **Port-forward** is simple, needs no extra components, and works on every cluster.

---

# 5) Optional: Install Metrics Server (for HPA)

Horizontal Pod Autoscaler needs the **Metrics Server**. It’s **not included** in Docker Desktop’s cluster by default. ([Docker Documentation][3], [DEV Community][6])

**Install via Helm (recommended on Windows)**

```bash
# If you don't have Helm:
choco install kubernetes-helm -y

# Add repo & install with the local-dev flag
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update
helm upgrade --install metrics-server metrics-server/metrics-server -n kube-system ^
  --set args[0]="--kubelet-insecure-tls"
```

Now:

```bash
kubectl top nodes   # should show CPU/Memory
kubectl top pods -A
kubectl apply -f 06-hpa.yaml
```

**Why**

* HPA pulls CPU/Memory from Metrics API; the flag `--kubelet-insecure-tls` is a **local-only convenience** because your kubelet uses self-signed certs in Docker Desktop. Don’t use it in prod. ([Kubernetes][7], [jabbermouth.co.uk][8], [GitHub][9])

---

# 6) Optional: Ingress (clean URLs on localhost)

Docker Desktop **does not ship an Ingress controller**—you install one (popular: **ingress-nginx**). ([BLUESHOE][10], [Stack Overflow][11])

**Install ingress-nginx (NodePort binding)**

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx ^
  -n ingress-nginx --create-namespace ^
  --set controller.service.type=NodePort ^
  --set controller.service.nodePorts.http=30080 ^
  --set controller.service.nodePorts.https=30443
kubectl get pods -n ingress-nginx
kubectl get svc  -n ingress-nginx
```

Apply the supplied Ingress:

```bash
kubectl apply -f 05-ingress.yaml
```

Test:

```bash
# localtest.me and any subdomain (e.g., hello.localtest.me) resolve to 127.0.0.1
# so this hits your local machine:
curl http://hello.localtest.me:30080/api/hello
```

**Why**

* Ingress gives you **one entry point** (host/path routing) instead of juggling multiple NodePorts.
* `localtest.me` is a public DNS wildcard to `127.0.0.1`, so you don’t need to edit your hosts file for local dev. ([The Official Microsoft ASP.NET Site][12], [Super User][13])

> Tip: NodePort keeps things simple on laptops where there’s no cloud **LoadBalancer**. (Using NodePort to expose the ingress controller is a common local setup.) ([docs.k0sproject.io][14], [Platform9][15])

---

# 7) Persistent storage, Jobs, CronJobs

**Steps**

```bash
kubectl apply -f 07-pv-pvc.yaml   # hostPath PV/PVC
kubectl apply -f 08-job.yaml      # one-off task
kubectl apply -f 09-cronjob.yaml  # runs every 5 minutes
```

**Why**

* **hostPath** in Docker Desktop maps to the Linux VM filesystem—great for demos, not for production.
* **Job/CronJob** demonstrate batch and scheduled workloads.

---

# 8) Clean up

```bash
kubectl delete ns lesson
# If you installed extras:
helm uninstall ingress-nginx -n ingress-nginx
helm uninstall metrics-server -n kube-system
```

---

## Troubleshooting (Windows)

* **K8s won’t enable**: ensure WSL 2 is installed/updated and virtualization is on; retry **Enable Kubernetes** in Docker Desktop. ([Microsoft Learn][1], [Docker Documentation][3])
* **HPA shows “Metrics API not available”**: install Metrics Server with the `--kubelet-insecure-tls` arg as above. ([DEV Community][6])
* **Ingress 404/connection refused**: verify the controller is running and **use the NodePort** you set (e.g., 30080). Ingress only works **after** an ingress controller is installed. ([Stack Overflow][11])
* **Custom host not resolving**: use `hello.localtest.me` (auto-resolves to 127.0.0.1). ([The Official Microsoft ASP.NET Site][12])

---

## What you just learned (the “why” in one glance)

* **Namespace** = workspace boundaries.
* **ConfigMap & Secret** = 12-factor config (code stays immutable).
* **Deployment & Service** = reliable rollouts + stable virtual IP.
* **Ingress** = single front door with host/path routing (needs a controller).
* **HPA + Metrics Server** = scale on CPU/memory signals.
* **Jobs/CronJobs** = batch and scheduled work.
* **PV/PVC** = persistent data (demoed via hostPath locally).

If you want, I can **generate a Windows-only README.md** that drops straight into the project (with all the commands above) so your learners can follow it step-by-step.

[1]: https://learn.microsoft.com/en-us/windows/wsl/install?utm_source=chatgpt.com "How to install Linux on Windows with WSL"
[2]: https://docs.docker.com/desktop/setup/install/windows-install/?utm_source=chatgpt.com "Install Docker Desktop on Windows"
[3]: https://docs.docker.com/desktop/features/kubernetes/?utm_source=chatgpt.com "Deploy on Kubernetes with Docker Desktop"
[4]: https://www.docker.com/blog/how-to-set-up-a-kubernetes-cluster-on-docker-desktop/?utm_source=chatgpt.com "How to Set Up a Kubernetes Cluster on Docker Desktop"
[5]: https://learn.microsoft.com/en-us/windows/wsl/?utm_source=chatgpt.com "Windows Subsystem for Linux Documentation"
[6]: https://dev.to/docker/enable-kubernetes-metrics-server-on-docker-desktop-5434?utm_source=chatgpt.com "Enable Kubernetes Metrics Server on Docker Desktop"
[7]: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/?utm_source=chatgpt.com "HorizontalPodAutoscaler Walkthrough"
[8]: https://www.jabbermouth.co.uk/blog/2022/12/09/install-metrics-server-in-docker-desktop-kubernetes-with-helm/?utm_source=chatgpt.com "Install Metrics Server in Docker Desktop Kubernetes with Helm"
[9]: https://github.com/kubernetes-sigs/metrics-server?utm_source=chatgpt.com "kubernetes-sigs/metrics-server: Scalable and efficient ..."
[10]: https://www.blueshoe.io/blog/docker-desktop-and-kubernetes/?utm_source=chatgpt.com "Docker Desktop and Kubernetes"
[11]: https://stackoverflow.com/questions/65193758/enable-ingress-controller-on-docker-desktop-with-wls2?utm_source=chatgpt.com "Enable Ingress controller on Docker Desktop with WLS2"
[12]: https://weblogs.asp.net/owscott/introducing-testing-domain-localtest-me?utm_source=chatgpt.com "Scott Forsyth's Blog - Introducing Testing Domain - localtest.me"
[13]: https://superuser.com/questions/1280827/why-does-the-registered-domain-name-localtest-me-resolve-to-127-0-0-1?utm_source=chatgpt.com "Why does the registered domain name “localtest.me” ..."
[14]: https://docs.k0sproject.io/v1.22.1%2Bk0s.0/examples/nginx-ingress/?utm_source=chatgpt.com "NGINX Ingress Controller - Documentation"
[15]: https://platform9.com/learn/v1.0/tutorials/nodeport-ingress?utm_source=chatgpt.com "How to deploy a NodePort Ingress Controller on Kubernetes"
