# White Paper: Transitioning from Self-Managed Kubernetes to Amazon EKS (Updated Edition)

## Executive Summary
Operating large-scale, self-managed Kubernetes (K8s) clusters continues to present significant challenges, including hardware constraints, cluster instability, and high operational overhead. This updated white paper builds on the original guidance for infrastructure administrators considering a transition to Amazon Elastic Kubernetes Service (EKS). It incorporates recent advancements as of 2025, such as the new Amazon EKS Dashboard for multi-cluster visibility, enhanced cost transparency, multi-cluster management tools like GitOps and Cluster API, and real-world case studies from organizations like Riot Games and JFrog. The paper outlines key issues in on-premises deployments, presents updated scenarios, and provides an expanded decision framework for evaluating EKS, on-prem, and hybrid models. New additions include detailed pricing breakdowns, migration timelines, diagnostic tools for CPU starvation, and training recommendations to ensure a smooth transition.

---

## 1. Challenges with Self-Managed Kubernetes

### 1.1 Hardware Limitations
- **Scenario:** A cluster with 36 chambers where the number of virtual CPUs (vCPUs) exceeded the physical CPUs available. This oversubscription caused CPU starvation, resulting in pod evictions, performance degradation, and instability across multiple clusters.
- **Impact:** Applications experienced intermittent outages, and control plane services (e.g., etcd, kube-scheduler) became unreliable.
- **Updated Guidance:** In 2025, oversubscription issues are exacerbated in multi-cluster setups due to inconsistent resource policies. Use diagnostic tools like `kubectl top nodes/pods` or Prometheus metrics (e.g., `container_cpu_usage_seconds_total` vs. node capacity, `container_cpu_throttling`) to quantify starvation early. This helps identify if average CPU utilization exceeds 80%, a common threshold for instability.

### 1.2 Operational Overhead
- **Tasks:** Admins are responsible for control plane management, etcd snapshots, OS patching, and CNI/CNI plugin upgrades.
- **Impact:** Significant staff hours spent “keeping the lights on,” reducing the time available for innovation and feature delivery.
- **Updated Guidance:** Multi-cluster environments (e.g., 36+ chambers) amplify config drift. Tools like Argo CD or Flux for GitOps can automate synchronization, reducing overhead by 30-50% based on 2025 CNCF surveys.

### 1.3 Scaling Bottlenecks
- **Scenario:** Scaling required hardware procurement and racking, leading to weeks or months of lead time.
- **Impact:** Inability to respond quickly to demand spikes.
- **Updated Guidance:** In dynamic 2025 workloads, manual scaling delays can lead to missed SLAs. Integrate Cluster Autoscaler for proactive node adjustments, and consider Karpenter for event-driven provisioning to handle bursts without overprovisioning.

---

## 2. Benefits of Amazon EKS

### 2.1 Managed Control Plane
- AWS manages the etcd database, API servers, and upgrades.
- Removes risk of control plane outages due to hardware saturation.
- **Updated Guidance:** With the 2025 release of the Amazon EKS Dashboard, admins gain unified visibility across clusters in multiple regions/accounts, simplifying monitoring of health, resources, and costs.

### 2.2 Elastic Compute Scaling
- Auto Scaling Groups (ASGs) and Karpenter allow elastic node scaling.
- Supports EC2 On-Demand, Spot Instances, and AWS Fargate.
- **Updated Guidance:** Karpenter now supports heterogeneous instance types, enabling optimized scaling for diverse workloads in multi-cluster setups.

### 2.3 Operational Simplicity
- Reduced patching, monitoring, and backup overhead.
- AWS Service Level Agreements (SLAs) ensure availability and resiliency (99.95% for control plane).
- **Updated Guidance:** Integrate with AWS Organizations for delegated access, reducing setup complexity for large teams.

### 2.4 Cost Optimization
- Ability to burst capacity during peak times without maintaining idle hardware.
- Spot instances reduce compute costs for fault-tolerant workloads.
- **Updated Pricing Details (as of 2025):** 
  - Control Plane: $0.10 per cluster per hour for standard Kubernetes support (~$73/month); $0.60 per hour for extended support.
  - EC2: Billed separately per instance type (e.g., via On-Demand, Reserved Instances, or Spot).
  - Fargate: Per vCPU and memory, rounded to the nearest second (minimum 1 minute); detailed at aws.amazon.com/fargate/pricing.
  - EKS Auto Mode: Additional per-second charges per instance (e.g., $0.03672/hour for c6a.2xlarge in US West Oregon), plus EC2 costs.
  - Hybrid Nodes: Tiered per vCPU-hour (e.g., $0.020 for first 576,000 monthly vCPU-hours, down to $0.006 over 11,520,000).
  - CloudWatch Container Insights: ~$0.30 per metric per month (billed separately; enable for full observability).
  - Savings Options: Compute Savings Plans, Reserved Instances, or Spot for up to 70% savings; no upfront commitments required.

---

## 3. Decision Framework: On-Prem vs EKS vs Hybrid

| Criteria                | On-Premises (Self-Managed)              | EKS (Fully Managed)                          | Hybrid Model                                  |
|-------------------------|-----------------------------------------|----------------------------------------------|-----------------------------------------------|
| **Control Plane**       | Full admin responsibility               | Managed by AWS                               | Some clusters on-prem, others on AWS          |
| **Scaling**             | Limited by hardware availability        | Elastic via AWS infra (e.g., Karpenter)      | Mix: burst to AWS, baseline on-prem           |
| **Operational Overhead**| High (patching, backups, monitoring)    | Low (AWS manages core infra; EKS Dashboard)  | Medium (dual management overhead)             |
| **Cost Model**          | High CapEx upfront, lower OpEx          | Pay-as-you-go (~$0.10/hour control plane)    | Balance of CapEx + OpEx                       |
| **Resiliency**          | Hardware failures impact stability      | AWS SLA-backed (99.95%)                      | Split resiliency: on-prem + cloud failover    |
| **Lock-In**             | Vendor neutral                          | AWS-centric (Kubernetes-conformant)          | Partial lock-in                               |
| **Multi-Cluster Mgmt**  | High complexity (custom federation)     | Simplified with EKS Dashboard, GitOps        | Hybrid tools like EKS Anywhere + Argo CD      |

**Updated Guidance:** Added row for multi-cluster management, emphasizing 2025 tools like EKS Dashboard for filtering/search/export and GitOps for config consistency.

---

## 4. Administrator Guidance: Best Practices

### 4.1 Resource Management
- Use **ResourceQuotas** and **LimitRanges** to prevent workloads from starving critical system pods.
- Enable **Vertical Pod Autoscaler (VPA)** for automatic resource tuning.
- Deploy **Karpenter** on EKS for dynamic provisioning.
- **Updated Guidance:** For multi-cluster, use PriorityClasses and taints/tolerations to balance resources. Implement Kubernetes Network Policies for pod-to-pod isolation.

### 4.2 Monitoring and Observability
- Implement **Prometheus + Grafana** or **CloudWatch Container Insights**.
- Track CPU throttling, eviction events, and pod restarts (e.g., via `kubectl top` or metrics like `kube_pod_status_reason{reason="Evicted"}`).
- **Updated Guidance:** Leverage the EKS Dashboard for advanced filtering to identify at-risk clusters. Set alerts for >80% utilization to preempt starvation.

### 4.3 Security and Compliance
- Integrate **IAM Roles for Service Accounts (IRSA)** in EKS.
- Use **AWS Security Hub** and **GuardDuty** for compliance monitoring.
- Regularly scan container images with **Amazon ECR scanning** or third-party tools.
- **Updated Guidance:** For multi-tenant clusters, adopt AWS App Mesh for service mesh and enforce least-privilege access.

### 4.4 Cost Optimization
- Mix **On-Demand + Spot** instances for compute savings.
- Use **Savings Plans** or **Reserved Instances** for steady-state workloads.
- Consider **Fargate** for small, bursty workloads to avoid idle nodes.
- **Updated Guidance:** Monitor with CloudWatch; aim for 50-70% utilization. For hybrid, use tiered Hybrid Nodes pricing to scale economically.

### 4.5 Hybrid Strategy
- Use **EKS Anywhere** for on-prem clusters with central AWS management.
- Deploy stateless, bursty workloads in AWS while keeping stateful workloads on-prem.
- Implement **service mesh (Istio or AWS App Mesh)** for consistent networking.
- **Updated Guidance:** Incorporate GitOps (Argo CD/Flux) and Cluster API for lifecycle management. Use EKS Fargate for serverless abstraction in hybrid setups.

### 4.6 Training and Adoption
- **New Section:** Provide AWS-specific training for teams (e.g., via AWS Skill Builder courses on IAM, Karpenter, and EKS Dashboard). Focus on Kubernetes certifications to bridge skills gaps, ensuring admins can handle diagnostics and multi-cluster ops effectively.

---

## 5. Example Migration Roadmap with Timelines

1. **Assessment Phase (1-2 Weeks)**
   - Inventory workloads and identify candidates for cloud migration.
   - Evaluate compliance and data residency requirements.

2. **Pilot Deployment (1-3 Months)**
   - Create an EKS cluster for non-critical, stateless services.
   - Implement observability stack (Prometheus, Grafana, or CloudWatch).

3. **Hybrid Rollout (3-6 Months)**
   - Migrate elastic workloads (CI/CD runners, ephemeral jobs) to EKS.
   - Retain stateful or latency-sensitive services on-prem.

4. **Optimization Phase (Ongoing, 1-3 Months Post-Rollout)**
   - Introduce autoscaling (HPA, VPA, Karpenter).
   - Optimize costs with Spot instances and Fargate.

5. **Full Adoption** (Optional, 6-12 Months)
   - Move majority of workloads to EKS.
   - Keep on-prem only for regulatory or specialized hardware needs.

**Updated Guidance:** Timelines based on 2025 case studies; adjust for team size. Use in-place upgrades with runbooks, upgrading control/data planes sequentially per AWS best practices.

---

## 6. Real-World Case Studies (New Section)
- **[Riot Games (2025)](https://aws.amazon.com/solutions/case-studies/riot-games-case-study/):** Migrated to EKS, cutting $10M in annual infrastructure costs through modernization and elastic scaling.
- **JFrog (2025):** Reduced carbon footprint by 60% and costs by 20% using EKS and Graviton processors for seamless migrations.
- **CAFU (2025):** Doubled engineering productivity by modernizing infrastructure on EKS, addressing scaling bottlenecks.
- **Coinbase:** Scaled 50% faster and cut costs 62% by migrating Auto Scaling groups to EKS.
- **Crossuite:** Saved 30% on costs and achieved 99.9% uptime with EKS for eHealth apps.

These examples demonstrate EKS's impact on cost savings (20-62%), scalability, and operational efficiency in multi-cluster transitions.

---

## Conclusion
Moving from self-managed Kubernetes to Amazon EKS can significantly reduce operational burden, improve resiliency, and enable elastic scaling, especially with 2025 enhancements like the EKS Dashboard and advanced GitOps tools. While on-prem infrastructure provides control and compliance benefits, the trade-off is high maintenance overhead and scaling limitations. A hybrid approach offers a pragmatic middle ground for organizations not ready for full cloud adoption.

Administrators are encouraged to evaluate workloads systematically, pilot EKS with stateless services, and gradually expand adoption while maintaining strong monitoring, security, and cost governance. Incorporate training to empower teams, and leverage case studies for proven strategies. For tailored advice, consult AWS documentation or partners.

