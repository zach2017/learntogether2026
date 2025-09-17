# White Paper: Transitioning from Self-Managed Kubernetes to EKS

## Executive Summary

Operating large-scale, self-managed Kubernetes (K8s) clusters presents significant challenges, including hardware constraints, cluster instability, and high operational overhead. This paper provides guidance for infrastructure administrators considering a transition to Amazon Elastic Kubernetes Service (EKS). It outlines the key issues encountered in on-premises deployments, presents example scenarios, and offers a structured decision framework for evaluating EKS, on-prem, and hybrid models.

---

## 1. Challenges with Self-Managed Kubernetes

### 1.1 Hardware Limitations

* **Scenario:** A cluster with 36 chambers where the number of virtual CPUs (vCPUs) exceeded the physical CPUs available. This oversubscription caused CPU starvation, resulting in pod evictions, performance degradation, and instability across multiple clusters.
* **Impact:** Applications experienced intermittent outages, and control plane services (e.g., etcd, kube-scheduler) became unreliable.

### 1.2 Operational Overhead

* **Tasks:** Admins are responsible for control plane management, etcd snapshots, OS patching, and CNI/CNI plugin upgrades.
* **Impact:** Significant staff hours spent “keeping the lights on,” reducing the time available for innovation and feature delivery.

### 1.3 Scaling Bottlenecks

* **Scenario:** Scaling required hardware procurement and racking, leading to weeks or months of lead time.
* **Impact:** Inability to respond quickly to demand spikes.

---

## 2. Benefits of Amazon EKS

### 2.1 Managed Control Plane

* AWS manages the etcd database, API servers, and upgrades.
* Removes risk of control plane outages due to hardware saturation.

### 2.2 Elastic Compute Scaling

* Auto Scaling Groups (ASGs) and Karpenter allow elastic node scaling.
* Supports EC2 On-Demand, Spot Instances, and AWS Fargate.

### 2.3 Operational Simplicity

* Reduced patching, monitoring, and backup overhead.
* AWS Service Level Agreements (SLAs) ensure availability and resiliency.

### 2.4 Cost Optimization

* Ability to burst capacity during peak times without maintaining idle hardware.
* Spot instances reduce compute costs for fault-tolerant workloads.

---

## 3. Decision Framework: On-Prem vs EKS vs Hybrid

| Criteria                 | On-Premises (Self-Managed)           | EKS (Fully Managed)          | Hybrid Model                               |
| ------------------------ | ------------------------------------ | ---------------------------- | ------------------------------------------ |
| **Control Plane**        | Full admin responsibility            | Managed by AWS               | Some clusters on-prem, others on AWS       |
| **Scaling**              | Limited by hardware availability     | Elastic via AWS infra        | Mix: burst to AWS, baseline on-prem        |
| **Operational Overhead** | High (patching, backups, monitoring) | Low (AWS manages core infra) | Medium (dual management overhead)          |
| **Cost Model**           | High CapEx upfront, lower OpEx       | Pay-as-you-go, OpEx-driven   | Balance of CapEx + OpEx                    |
| **Resiliency**           | Hardware failures impact stability   | AWS SLA-backed               | Split resiliency: on-prem + cloud failover |
| **Lock-In**              | Vendor neutral                       | AWS-centric integrations     | Partial lock-in                            |

---

## 4. Administrator Guidance: Best Practices

### 4.1 Resource Management

* Use **ResourceQuotas** and **LimitRanges** to prevent workloads from starving critical system pods.
* Enable **Vertical Pod Autoscaler (VPA)** for automatic resource tuning.
* Deploy **Karpenter** on EKS for dynamic provisioning.

### 4.2 Monitoring and Observability

* Implement **Prometheus + Grafana** or **CloudWatch Container Insights**.
* Track CPU throttling, eviction events, and pod restarts.

### 4.3 Security and Compliance

* Integrate **IAM Roles for Service Accounts (IRSA)** in EKS.
* Use **AWS Security Hub** and **GuardDuty** for compliance monitoring.
* Regularly scan container images with **Amazon ECR scanning** or third-party tools.

### 4.4 Cost Optimization

* Mix **On-Demand + Spot** instances for compute savings.
* Use **Savings Plans** or **Reserved Instances** for steady-state workloads.
* Consider **Fargate** for small, bursty workloads to avoid idle nodes.

### 4.5 Hybrid Strategy

* Use **EKS Anywhere** for on-prem clusters with central AWS management.
* Deploy stateless, bursty workloads in AWS while keeping stateful workloads on-prem.
* Implement **service mesh (Istio or AWS App Mesh)** for consistent networking.

---

## 5. Example Migration Roadmap

1. **Assessment Phase**

   * Inventory workloads and identify candidates for cloud migration.
   * Evaluate compliance and data residency requirements.

2. **Pilot Deployment**

   * Create an EKS cluster for non-critical, stateless services.
   * Implement observability stack (Prometheus, Grafana, or CloudWatch).

3. **Hybrid Rollout**

   * Migrate elastic workloads (CI/CD runners, ephemeral jobs) to EKS.
   * Retain stateful or latency-sensitive services on-prem.

4. **Optimization Phase**

   * Introduce autoscaling (HPA, VPA, Karpenter).
   * Optimize costs with Spot instances and Fargate.

5. **Full Adoption** (Optional)

   * Move majority of workloads to EKS.
   * Keep on-prem only for regulatory or specialized hardware needs.

---

## Conclusion

Moving from self-managed Kubernetes to Amazon EKS can significantly reduce operational burden, improve resiliency, and enable elastic scaling. While on-prem infrastructure provides control and compliance benefits, the trade-off is high maintenance overhead and scaling limitations. A hybrid approach offers a pragmatic middle ground for organizations not ready for full cloud adoption.

Administrators are encouraged to evaluate workloads systematically, pilot EKS with stateless services, and gradually expand adoption while maintaining strong monitoring, security, and cost governance.
