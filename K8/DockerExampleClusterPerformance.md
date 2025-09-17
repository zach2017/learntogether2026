# White Paper: Transitioning from Self-Managed Kubernetes to EKS

## Executive Summary

Operating large-scale, self-managed Kubernetes (K8s) clusters presents significant challenges, including hardware constraints, cluster instability, and high operational overhead. This paper provides guidance for infrastructure administrators considering a transition to Amazon Elastic Kubernetes Service (EKS). It outlines the key issues encountered in on-premises deployments, presents example scenarios, provides a structured migration guide, and includes a **hands-on simulation with Docker Compose** to test oversubscription and mitigation strategies.

---

## 1. Challenges with Self-Managed Kubernetes

### 1.1 Hardware Limitations

* **Scenario:** A cluster with 20 chambers where the number of virtual CPUs (vCPUs) exceeded the physical CPUs available. This oversubscription caused CPU starvation, resulting in pod evictions, performance degradation, and instability across multiple clusters.

### 1.2 Operational Overhead

* **Tasks:** Admins are responsible for control plane management, etcd snapshots, OS patching, and CNI/CNI plugin upgrades.
* **Impact:** Significant staff hours spent “keeping the lights on,” reducing the time available for innovation and feature delivery.

### 1.3 Scaling Bottlenecks

* **Scenario:** Scaling required hardware procurement and racking, leading to weeks or months of lead time.
* **Impact:** Inability to respond quickly to demand spikes.

---

## 2. Benefits of Amazon EKS

* **Managed Control Plane:** AWS manages etcd, API servers, and upgrades.
* **Elastic Compute Scaling:** Supports Auto Scaling Groups, Karpenter, Spot Instances, and Fargate.
* **Operational Simplicity:** Reduces patching and control plane maintenance.
* **Cost Optimization:** Enables burst capacity without idle hardware.

---

## 3. Step-by-Step Migration Guide

### Step 1: Assessment & Planning

* **Tasks:** Inventory workloads, map dependencies, classify stateful vs. stateless.
* **Example:** Separate CI/CD runners (stateless) from financial services (stateful).

### Step 2: Prepare AWS Environment

* Set up AWS accounts, IAM roles, and VPC networking.
* Create IAM roles for nodes and service accounts.

### Step 3: Create a Pilot EKS Cluster

* **Example Command:**

  ```bash
  eksctl create cluster \
    --name pilot-cluster \
    --region us-east-1 \
    --nodegroup-name ng-default \
    --node-type t3.large \
    --nodes 3
  ```

### Step 4: Migrate Stateless Workloads First

* Containerize apps and deploy CI/CD agents or web services.
* Use Ingress controllers for traffic routing.

### Step 5: Implement Scaling & Cost Controls

* Enable Horizontal Pod Autoscaler (HPA).
* Configure Karpenter for dynamic node scaling.

### Step 6: Migrate Stateful Workloads

* Use RDS, DynamoDB, or DocumentDB for databases.
* For K8s persistent storage, use EBS/EFS.

### Step 7: Optimize Operations

* Logging, observability, IAM Roles for Service Accounts (IRSA).

### Step 8: Expand or Go Hybrid

* Use EKS Anywhere for hybrid deployments.

---

## 4. Example Migration Roadmap

1. **Assessment Phase** – Inventory workloads and classify them.
2. **Pilot Deployment** – Deploy non-critical, stateless services.
3. **Hybrid Rollout** – Migrate elastic workloads to AWS, retain stateful on-prem.
4. **Optimization** – Autoscaling, cost savings, observability.
5. **Full Adoption** – Optionally migrate most workloads to EKS.

---

## 5. Simulation: Using Docker Compose to Model Oversubscription

### docker-compose.yml

```yaml
version: '3.8'
services:
  webapp:
    image: nginx
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    ports:
      - "8080:80"

  api:
    image: python:3.9-slim
    command: python -m http.server 5000
    deploy:
      resources:
        limits:
          cpus: '1.0'
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
          cpus: '1.5'
          memory: 1G
    ports:
      - "5432:5432"
```

### Steps to Run

1. Save the file as `docker-compose.yml`.
2. Start the environment:

   ```bash
   docker compose up -d
   ```
3. Observe container CPU usage:

   ```bash
   docker stats
   ```

### Performance Testing

* Use a load generator such as **Apache Bench** or **wrk**:

  ```bash
  ab -n 10000 -c 100 http://localhost:8080/
  ```
* Simulate overload by lowering CPU limits or running multiple `ab` commands in parallel.

### Observed Issue

* If the host has fewer physical CPUs than requested, CPU steal time will rise, containers will slow down, and DB queries may fail.

### Mitigation Strategies

1. **Apply Resource Limits:** Enforce per-service CPU/memory limits as shown above.
2. **Horizontal Scaling:** Increase replicas of stateless apps.
3. **Offload DB:** Use managed DB (RDS) instead of overloading local Postgres.
4. **Move to EKS:** Let AWS autoscale nodes, preventing oversubscription of physical CPUs.

---

## Conclusion

Transitioning to Amazon EKS allows administrators to reduce operational burden, improve resiliency, and enable elastic scaling. The Docker Compose simulation illustrates how oversubscription leads to instability and why elastic, managed infrastructure like EKS is better suited for growth.
