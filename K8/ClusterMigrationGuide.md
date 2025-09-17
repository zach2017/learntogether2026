# Step‑by‑Step Migration Guide — Self‑Managed Kubernetes → Amazon EKS

This document is a practical, runnable guide for platform/infrastructure administrators migrating workloads from self‑managed Kubernetes clusters to Amazon EKS. It focuses on low‑risk, repeatable steps and includes concrete examples and command snippets you can adapt.

---

## Summary / Goals

* Move from self‑managed K8s to EKS with minimal downtime.
* Start with stateless workloads and progressively migrate stateful systems.
* Establish cloud best practices (security, observability, autoscaling, cost control).

---

## Prerequisites

* AWS account with privileges to create EKS clusters, IAM roles, VPCs, and EC2 instances.
* `aws` CLI installed and configured with an admin user (or role that can create resources).
* `eksctl` and `kubectl` installed on your admin workstation (or CI runner).
* Access to your existing cluster manifests, Helm charts, and CI/CD pipelines.

---

## Phase 0 — Assess & Plan

1. **Inventory workloads**: record namespaces, deployments, StatefulSets, PVs, PVCs, Ingresses, Secrets, ConfigMaps, CRDs.

   * Example categories: `stateless-web`, `ci-runners`, `batch-jobs`, `stateful-db`, `cache`.
2. **Classify each workload**: stateless (good first candidates), stateful (need migration plan), infra (ingress, monitoring, DNS)
3. **Identify dependencies**: external databases, storage backends, network/firewall constraints, data residency.
4. **Decide target architecture**: fully managed EKS vs. hybrid (EKS + on‑prem via EKS Anywhere).

**Output artifacts**: migration runbook per app, expected downtime, rollback plan, estimated cost.

---

## Phase 1 — Prepare AWS Environment

### Steps

1. Create or choose a VPC with subnets in required AZs (private subnets + NAT or public if needed).
2. Create an admin IAM user/role for cluster ops and set MFA.
3. Enable an OIDC provider for the cluster later (IRSA) — you can create it during cluster creation with `eksctl`.

**Useful local tools:**

* `eksctl` to create clusters (fast, repeatable).

**Example: install tools (mac/linux)**

```bash
# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# awscli (v2) and kubectl should already be installed per your platform
```

---

## Phase 2 — Create the EKS Cluster (Pilot)

Start with a small pilot cluster for non‑critical workloads.

### Option A: Quick cluster (managed nodegroup)

```bash
eksctl create cluster --name pilot-cluster --region us-east-1 --nodes 2 --node-type t3.medium
# then update kubeconfig
aws eks update-kubeconfig --name pilot-cluster --region us-east-1
```

### Option B: Cluster from config (example `cluster.yaml`)

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: pilot-cluster
  region: us-east-1
nodeGroups:
  - name: ng-standard
    instanceType: m5.large
    desiredCapacity: 2
    volumeSize: 50
    ssh:
      allow: true
```

```bash
eksctl create cluster -f cluster.yaml
```

**What to verify**: `kubectl get nodes`, `kubectl get pods -A` after you install the base control plane addons.

---

## Phase 3 — Platform Additions (Day‑2 Services)

These components make EKS production ready.

### 3.1 Cluster networking & Ingress

* Install AWS Load Balancer Controller for ALB/ NLB integrations (replaces some external controllers).

### 3.2 Storage

* Install AWS EBS CSI driver for dynamic PersistentVolumeClaims (if you plan to use EBS-backed StatefulSets).

### 3.3 Autoscaling

* For on‑demand node autoscaling use **Karpenter** (fast, right-sized instances) or EKS Cluster Autoscaler for managed nodegroups.
* For serverless compute use **Fargate** for appropriate namespaces/pods.

### 3.4 IAM for Workloads (IRSA)

* Create the OIDC provider and map IAM roles to K8s ServiceAccounts so pods get least‑privilege AWS access.

### Example: create an IAM service account with `eksctl`

```bash
eksctl create iamserviceaccount \
  --cluster pilot-cluster \
  --namespace default \
  --name s3-reader-sa \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \
  --approve
```

---

## Phase 4 — Observability & Security

1. Deploy Prometheus + Grafana or enable CloudWatch Container Insights for metrics/logs.
2. Deploy Fluent Bit or CloudWatch agent for logs collection.
3. Use image scanning in CI and runtime scanning where possible.
4. Apply RBAC and NetworkPolicies to limit lateral movement.

---

## Phase 5 — Migrate Stateless Workloads (Low Risk)

1. Choose a stateless app (e.g., web front end) and deploy to EKS using the same Helm chart or manifests.
2. Add resource `requests` and `limits` to each Deployment and use `LimitRanges` and `ResourceQuotas` in the target namespace.

**Example deployment snippet**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
    spec:
      containers:
      - name: frontend
        image: myrepo/web:latest
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

3. Expose via Service (type LoadBalancer) or Ingress (ALB via AWS Load Balancer Controller).
4. Smoke test, run canary traffic (Route53 weighted), then shift 100%.

### Example: kubectl drain when cutting over nodes

```bash
kubectl drain node/old-node-1 --ignore-daemonsets --delete-local-data
```

---

## Phase 6 — Migrate Stateful Services

Stateful workloads need careful planning.

**Options**:

* **Managed database** (recommended for many apps): migrate to Amazon RDS / Amazon Aurora and update apps to point to new endpoint.
* **K8s StatefulSet** with EBS volumes: snapshot, migrate PV data (snapshot + restore), or use application‑level replication (Postgres replication, Redis replication).

**Example approach (Postgres)**

1. Stand up an RDS Postgres instance (or RDS read replica) and configure networking.
2. Use `pg_dump / pg_restore` or logical replication to copy data.
3. Update the application ConfigMap/Secret to point to the new DB and roll pods in EKS.

If keeping DB on‑prem, consider hybrid networking (VPN/Direct Connect) and keep latency and egress costs in mind.

---

## Phase 7 — CI/CD and GitOps

* Integrate your pipeline to target the EKS cluster (update kubeconfig in CI runners).
* Consider GitOps (Argo CD / Flux) for progressive promotion and easier rollback.

**Example: add kubeconfig to CI (gitlab/jenkins)**

* Use an IAM user or IRSA for secure access, store kubeconfig as a secret, or use `aws eks update-kubeconfig` step with proper AWS credentials.

---

## Phase 8 — Cutover & Rollback Plan

1. Cutover strategy: blue/green or canary (Route53 weighted records or Ingress weights).
2. Monitor metrics and logs closely. Have a rollback plan (DNS revert, traffic shift back).
3. Keep the old cluster running but cordoned and drained for a short period until you're confident.

---

## Phase 9 — Decommission Old Cluster

1. Ensure backups, logging, and any retained data are moved.
2. Gradually scale down workloads on old cluster and finally run `eksctl delete cluster` (if applicable) or `kubeadm reset` for on‑prem.

---

## Phase 10 — Day‑2 Operations & Optimization

* Use Karpenter or Cluster Autoscaler + managed nodegroups.
* Mix Spot + On‑Demand instances for cost optimization; use Savings Plans / Reserved Instances for baseline.
* Enforce security posture and run periodic DR tests.

---

## Example YAMLs & Commands (Quick Copy)

### eksctl (create basic cluster)

```bash
eksctl create cluster --name prod-cluster --region us-east-1 --nodes 3 --node-type m5.large
```

### example Karpenter Provisioner (simplified)

```yaml
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  requirements:
  - key: "node.kubernetes.io/instance-type"
    operator: In
    values: ["m5.large","m5.xlarge"]
  limits:
    resources:
      cpu: "2000"
```

### create IRSA service account with eksctl

```bash
eksctl create iamserviceaccount \
  --name external-dns-sa \
  --namespace kube-system \
  --cluster prod-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonRoute53FullAccess \
  --approve
```

### kubectl drain (old node)

```bash
kubectl drain <old-node> --ignore-daemonsets --delete-local-data
```

---

## Common Pitfalls & Remediations

* **CPU oversubscription on VMs**: enforce resource requests/limits, use ResourceQuota & LimitRange.
* **Unexpected IAM issues**: use IRSA to avoid node IAM permission explosions.
* **Egress/network cost shock**: measure traffic and estimate AWS egress costs early.
* **Stateful app latency**: prefer managed DBs or test replication thoroughly.

---

## Next Steps / Checklist

* [ ] Inventory & classify all workloads
* [ ] Create pilot EKS cluster and test deployment
* [ ] Implement observability and IRSA
* [ ] Migrate stateless workloads first
* [ ] Plan and test stateful migrations
* [ ] Cutover & decommission old clusters

---

*This document is a living runbook — adapt resources, instance types, and exact commands to your org's requirements.*

Below are the **key highlights** plus authoritative references I used while assembling the guide so you can deep-dive or copy commands exactly from the source:

* Use `eksctl` for fast, repeatable cluster creation and to create IAM service accounts (IRSA). ([eksctl][1])
* Karpenter is the recommended open-source autoscaler for fast, right-sized node provisioning on EKS; consider it instead of slower scale-up approaches. ([AWS Documentation][2])
* AWS Fargate gives you serverless pod execution (no nodes to manage) — good for small/bursty stateless workloads. ([AWS Documentation][3])
* Use IAM Roles for Service Accounts (IRSA) to give pods least-privilege access to AWS APIs (no long-living node credentials). ([AWS Documentation][4])
* Follow the Amazon EKS Best Practices and the EKS Anywhere docs if you want a hybrid/on-prem option. ([AWS Documentation][5])


[1]: https://eksctl.io/usage/creating-and-managing-clusters/?utm_source=chatgpt.com "Creating and managing clusters"
[2]: https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html?utm_source=chatgpt.com "Karpenter - Amazon EKS"
[3]: https://docs.aws.amazon.com/eks/latest/userguide/fargate.html?utm_source=chatgpt.com "Simplify compute management with AWS Fargate"
[4]: https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html?utm_source=chatgpt.com "IAM roles for service accounts"
[5]: https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html?utm_source=chatgpt.com "Amazon EKS Best Practices Guide"
