# Kubernetes Lesson (Windows + Docker Desktop)

This guide is **Windows-only** and assumes you are using **Docker Desktop with Kubernetes enabled**.

---

## 1. Prerequisites

1. Install **WSL 2** (PowerShell as Administrator):
   ```ps1
   wsl --install
   ```
   Restart if asked.

2. Install **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/

3. Enable **Kubernetes** in Docker Desktop:
   - Open Docker Desktop → **Settings → Kubernetes**
   - Check **Enable Kubernetes**
   - Click **Apply & Restart**

4. Verify installation:
   ```bash
   kubectl version --client
   kubectl config current-context   # should be: docker-desktop
   kubectl get nodes                # should show Ready
   ```

---

## 2. Build the App Image

Unzip this project, then:

```bash
cd kubernetes-lesson/app
docker build -t hello-k8s:1.0.0 .
```

*Why*: This builds the Node.js API image. Docker Desktop shares it directly with the local K8s cluster.

---

## 3. Deploy Core Resources

```bash
cd ../k8s
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secret.yaml
kubectl apply -f 03-deployment.yaml
kubectl apply -f 04-service.yaml
```

*Why*:
- **Namespace** isolates resources.
- **ConfigMap & Secret** inject settings into the pods.
- **Deployment** runs 2 replicas of the app.
- **Service** gives a stable internal IP.

---

## 4. Test the Service

Forward port 8080 on localhost to the service:

```bash
kubectl -n lesson port-forward svc/hello-svc 8080:80
```

In another terminal:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/hello
```

---

## 5. Enable Autoscaling (HPA)

Install Metrics Server (required for HPA):

```bash
choco install kubernetes-helm -y
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm upgrade --install metrics-server metrics-server/metrics-server -n kube-system ^
  --set args[0]="--kubelet-insecure-tls"
```

Apply HPA:

```bash
kubectl apply -f 06-hpa.yaml
kubectl top pods -n lesson
```

---

## 6. Optional: Ingress Controller

Install NGINX ingress:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx ^
  -n ingress-nginx --create-namespace ^
  --set controller.service.type=NodePort ^
  --set controller.service.nodePorts.http=30080
```

Apply Ingress:

```bash
kubectl apply -f 05-ingress.yaml
```

Test:

```bash
curl http://hello.localtest.me:30080/api/hello
```

---

## 7. Storage, Jobs, CronJobs

```bash
kubectl apply -f 07-pv-pvc.yaml
kubectl apply -f 08-job.yaml
kubectl apply -f 09-cronjob.yaml
```

---

## 8. Clean Up

```bash
kubectl delete ns lesson
helm uninstall ingress-nginx -n ingress-nginx
helm uninstall metrics-server -n kube-system
```

---

## Recap

- **Namespace** keeps things tidy
- **ConfigMap/Secret** manage config securely
- **Deployment/Service** run + expose the app
- **Ingress** gives clean URLs
- **HPA** auto-scales based on load
- **Jobs/CronJobs** run batch/scheduled tasks
- **PV/PVC** show storage basics

This flow is **the same you’ll use in cloud K8s clusters**—only difference: Docker Desktop uses NodePort for ingress instead of LoadBalancer.