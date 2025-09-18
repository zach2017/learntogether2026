# White Paper: Transitioning from Self-Managed Kubernetes to EKS

## Executive Summary

Operating large-scale, self-managed Kubernetes (K8s) clusters presents significant challenges, including hardware constraints, cluster instability, and high operational overhead. This paper provides guidance for infrastructure administrators considering improvements in cluster management. It outlines the key issues encountered in on-premises deployments, presents example scenarios, provides a structured migration guide, and includes a **hands-on simulation with Docker Compose and local Kubernetes** to test oversubscription and mitigation strategies.

---

## 1. Challenges with Self-Managed Kubernetes

### 1.1 Hardware Limitations

* **Scenario:** A cluster with 36 chambers where the number of virtual CPUs (vCPUs) exceeded the physical CPUs available. This oversubscription caused CPU starvation, resulting in pod evictions, performance degradation, and instability across multiple clusters.

### 1.2 Operational Overhead

* **Tasks:** Admins are responsible for control plane management, etcd snapshots, OS patching, and CNI/CNI plugin upgrades.
* **Impact:** Significant staff hours spent “keeping the lights on,” reducing the time available for innovation and feature delivery.

### 1.3 Scaling Bottlenecks

* **Scenario:** Scaling required hardware procurement and racking, leading to weeks or months of lead time.
* **Impact:** Inability to respond quickly to demand spikes.

---

## 2. General Benefits of Managed or Improved Kubernetes

* **Stability:** Reduce risk of control plane outages by avoiding oversubscription.
* **Elastic Scaling (if supported):** Scale workloads horizontally to reduce contention.
* **Operational Simplicity:** Automate routine patching, monitoring, and recovery.
* **Cost/Resource Optimization:** Avoid wasted compute cycles by enforcing quotas and limits.

---

## 3. Step-by-Step Guidance for Admins

### Step 1: Assessment & Planning

* **Tasks:** Inventory workloads, map dependencies, classify stateful vs. stateless.
* **Example:** Separate CI/CD runners (stateless) from financial services (stateful).

### Step 2: Prepare Local Environment

* Install **Docker Desktop** or a similar container runtime.
* Install a lightweight Kubernetes distribution for testing (e.g., **kind** or **minikube**).

### Step 3: Simulate Oversubscription with Docker Compose

#### docker-compose.yml

```yaml
version: '3.8'
services:
  webapp:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 256M
    ports:
      - "8080:80"

  api:
    image: python:3.9-slim
    command: python -m http.server 5000
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 512M
    ports:
      - "5000:5000"

  db:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: example
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
    ports:
      - "5432:5432"

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alert.rules.yml:/etc/prometheus/alert.rules.yml
    ports:
      - "9090:9090"

  failover:
    image: nginx
    command: ["/bin/sh", "-c", "while true; do echo 'Failover active' > /usr/share/nginx/html/index.html; sleep 10; done"]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M
    ports:
      - "8081:80"

  haproxy:
    image: haproxy:2.8
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    ports:
      - "8085:8085"

  argocd:
    image: argoproj/argocd:v2.8.0
    ports:
      - "8082:8080"
    command: ["argocd-server", "--insecure"]
```

#### prometheus.yml (basic config with failover alert)

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['webapp:80', 'api:5000']

rule_files:
  - alert.rules.yml
```

#### alert.rules.yml (trigger failover)

```yaml
groups:
- name: overload-rules
  rules:
  - alert: HighCPUUsage
    expr: process_cpu_seconds_total > 0.8
    for: 30s
    labels:
      severity: critical
    annotations:
      description: "CPU usage exceeded threshold. Switch traffic to failover."
```

#### haproxy.cfg (redirect traffic on failover)

```cfg
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s

frontend http-in
  bind *:8085
  default_backend primary

backend primary
  option httpchk GET /
  server webapp webapp:80 check
  server api api:5000 check
  use_backend failover if { nbsrv(primary) lt 1 }

backend failover
  server failover failover:80 check
```

In this setup:

* HAProxy serves as the entry point (`localhost:8085`).
* It routes to `webapp` and `api` when healthy.
* If Prometheus triggers a CPU overload alert, you can use an external script to dynamically reload HAProxy or switch DNS to direct traffic to `failover:8081`.

**How to Run:**

```bash
docker compose up -d
docker stats
```

Visit HAProxy at: [http://localhost:8085](http://localhost:8085)

---

## 4. Simulating in Kubernetes (Local Cluster)

Create a test cluster using `kind`:

```bash
kind create cluster --name oversub-test
```

### Example Deployment (CPU Heavy Pod)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpu-burner
spec:
  replicas: 5
  selector:
    matchLabels:
      app: cpu-burner
  template:
    metadata:
      labels:
        app: cpu-burner
    spec:
      containers:
      - name: stress
        image: progrium/stress
        args: ["--cpu", "2"]
        resources:
          requests:
            cpu: "500m"
            memory: "128Mi"
          limits:
            cpu: "1"
            memory: "256Mi"
```

Deploy it:

That error usually means the **metrics-server** isn’t running in your cluster (kind/minikube don’t ship with it by default). `kubectl top` relies on the **Kubernetes Metrics API**, which is provided by metrics-server.

Here’s how you can fix it:

### 1. Deploy metrics-server

Run this command in your cluster:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Edit the Deployment (if needed, for kind/minikube)

On local clusters without proper TLS SANs, you need to allow insecure TLS:

```bash
kubectl -n kube-system edit deployment metrics-server
```

Add these flags under `args:` for the metrics-server container:

```yaml
- --kubelet-insecure-tls
- --kubelet-preferred-address-types=InternalIP,Hostname,ExternalIP
```

Then save and exit.

### 3. Verify it’s running

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

NOTE: using the next command Add these flags under args: for the metrics-server container:

- --kubelet-insecure-tls
- --kubelet-preferred-address-types=InternalIP,Hostname,ExternalIPd 
kubectl -n kube-system edit deployment metrics-server

kubectl get pods -n kube-system | grep metrics-server
```

### 4. Try again

```bash
kubectl top nodes
kubectl top pods
```


When replicas > available cores, you’ll see pods throttled.

---

## 5. Mitigation Strategies

1. **Resource Limits:** Always set CPU and memory `requests` and `limits` in pod specs.
2. **Quotas:** Apply **ResourceQuota** and **LimitRange** per namespace.
3. **Failover Mechanisms:** Add backup pods/services and redirect traffic via HAProxy.
4. **Horizontal Scaling:** Increase replicas of stateless workloads instead of overcommitting CPUs.
5. **Node Right-Sizing:** Match node instance size (in test clusters: VM specs) to expected workload.
6. **Monitoring:** Use Prometheus dashboards (or `kubectl top`) to track CPU throttling.
7. **GitOps Management:** Use ArgoCD to continuously sync and roll out mitigation manifests.

---

## 6. Example Workflow for Admins

1. **Start local simulation with Docker Compose** to understand oversubscription effects.
2. **Use Prometheus** to visualize CPU and memory usage under load.
3. **Trigger failover** and automatically redirect traffic through HAProxy.
4. **Use ArgoCD (in Docker)** to simulate GitOps management of your services.
5. **Recreate with kind/minikube** to see how K8s enforces limits.
6. **Apply mitigations**: set limits, quotas, autoscaling, and failover strategies.
7. **Document learnings** for production strategy (on-prem or managed service).

---

## Conclusion

Oversubscription of CPU resources leads to cluster instability in both Docker and Kubernetes. By simulating the issue locally with Docker Compose, monitoring with Prometheus, and redirecting traffic to failover services via HAProxy, administrators can practice mitigation strategies in a safe lab. This provides a foundation for improving stability—whether clusters remain self-managed or eventually move to a managed solution.
