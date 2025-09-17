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
    ports:
      - "9090:9090"
```

#### prometheus.yml (basic config)

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['webapp:80', 'api:5000']
```

**How to Run:**

```bash
docker compose up -d
docker stats
```

Visit Prometheus at: [http://localhost:9090](http://localhost:9090)

**Load Test Example:**

```bash
ab -n 5000 -c 200 http://localhost:8080/
```

Prometheus will capture request metrics and allow you to query CPU/memory trends.

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

```bash
kubectl apply -f cpu-burner.yaml
kubectl top pods
```

When replicas > available cores, you’ll see pods throttled.

---

## 5. Mitigation Strategies

1. **Resource Limits:** Always set CPU and memory `requests` and `limits` in pod specs.
2. **Quotas:** Apply **ResourceQuota** and **LimitRange** per namespace.
3. **Horizontal Scaling:** Increase replicas of stateless workloads instead of overcommitting CPUs.
4. **Node Right-Sizing:** Match node instance size (in test clusters: VM specs) to expected workload.
5. **Monitoring:** Use Prometheus dashboards (or `kubectl top`) to track CPU throttling.

---

## 6. Example Workflow for Admins

1. **Start local simulation with Docker Compose** to understand oversubscription effects.
2. **Use Prometheus** to visualize CPU and memory usage under load.
3. **Recreate with kind/minikube** to see how K8s enforces limits.
4. **Apply mitigations**: set limits, quotas, and autoscaling.
5. **Document learnings** for production strategy (on-prem or managed service).

---

## Conclusion

Oversubscription of CPU resources leads to cluster instability in both Docker and Kubernetes. By simulating the issue locally with Docker Compose, monitoring with Prometheus, and repeating the test in kind, administrators can better understand contention, test mitigation strategies, and enforce best practices such as quotas and autoscaling. This provides a foundation for improving stability—whether clusters remain self-managed or eventually move to a managed solution.
