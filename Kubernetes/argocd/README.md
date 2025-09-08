# Argo CD — What, Why, and How (Intro)

Argo CD is a **GitOps** controller for Kubernetes. You describe the desired state of your apps in **Git** (manifests, Kustomize, Helm, etc.). Argo CD continuously **compares** that desired state to what’s actually running in the cluster and **synchronizes** differences (drift) to keep them in sync.

---

## Why teams use Argo CD

- **Single source of truth** — Git holds the canonical state of every environment.
- **Continuous delivery, not scripting** — Argo CD reconciles to Git automatically (or on demand).
- **Safe & auditable** — Pull requests = change reviews. Git history = deploy history.
- **Fast rollbacks** — Revert a commit or sync to a previous revision.
- **Self-heal** — Detects drift (manual kubectl edits) and reverts to declared state.
- **Multi-cluster** — Manage many clusters and environments from one UI/CLI.
- **Works with your tools** — Plain YAML, Kustomize, Helm, KSOPS/SOPS/SealedSecrets, etc.

---

## Core concepts (at a glance)

- **Application** — Custom resource that points to a repo `repoURL`, `path`, `targetRevision`, and a **destination** (cluster + namespace). Defines the **sync policy**.
- **AppProject** — Policy boundary for groups of Applications (allowed repos, destinations, cluster-scoped resources, RBAC).
- **Sync policy** — Manual (click **Sync**) or **Automated** (optionally **prune** + **self-heal**).
- **Health & Status** — Argo CD computes health (Healthy/Degraded/Progressing) and shows OutOfSync/Sync’d.
- **Hooks & Waves** — Orchestrate pre/post sync jobs and ordering across resources.
- **Repo Server / Controller / API Server** — Argo CD services that fetch, render, and apply desired state.

---

## Typical flows & processes

### 1) Basic GitOps (single env)
```
Dev commit -> CI builds & pushes image -> CI updates manifest tag in Git
        \-> Argo CD detects repo change -> renders manifests -> Sync -> App updated
```
- **Where CI stops:** after updating manifests in Git (e.g., kustomize image tag, Helm values).
- **Where Argo CD starts:** detects Git change and **reconciles** cluster to match.

### 2) PR-based deployments (manual promotion)
```
Feature branch -> PR -> Review -> Merge to main
Argo CD watches `main` -> Sync -> Deploy to dev
```
- Promote to staging/prod by merging or tagging to those environment branches/paths.

### 3) Multi-environment promotion
```
/environments
  /dev      (values-dev.yaml / kustomize dev overlays)
  /staging  (values-stg.yaml / kustomize stg overlays)
  /prod     (values-prod.yaml / kustomize prod overlays)
```
- **Argo CD Applications** per environment. Promotion = PR to the next env’s config.

### 4) App of Apps pattern
- One “root” Application points to a directory of child Application manifests.  
- Useful for **bootstrapping** a cluster or an entire environment stack.

### 5) Rollback
- Revert a Git commit or select a previous **targetRevision** in the UI/CLI → Sync.  
- Argo CD applies the older desired state (no manual diffing needed).

---

## Key DevOps tasks checklist

**Install & bootstrap**
- [ ] Install Argo CD in the cluster (namespace `argocd`).
- [ ] Retrieve initial `admin` password, set SSO (OIDC) if desired.
- [ ] (Optional) Expose UI via port-forward, NodePort, or Ingress.

**Repo & structure**
- [ ] Create Git repos/paths for `apps/` and `environments/` (dev/staging/prod).
- [ ] Standardize on **Helm** or **Kustomize** overlays for env-specific config.
- [ ] Add image-tag update step to CI (e.g., `kustomize edit set image` or Helm values bump).

**Security & policy**
- [ ] Define **AppProjects** per team or environment (allowed repos/destinations).
- [ ] Enable RBAC (viewer/operator/admin) and SSO mapping to teams.
- [ ] Secrets: pick a method (SOPS/Sealed Secrets/External Secrets).

**App onboarding**
- [ ] One Application per service (or per env), with `CreateNamespace=true`.
- [ ] Choose sync mode: manual vs. automated; consider **prune** and **self-heal**.
- [ ] Configure health checks and sync options (e.g., server-side apply, replace).

**Operations**
- [ ] Monitoring & alerts (controller metrics, app health, sync failures).
- [ ] Notifications (Slack/Teams/Webhook) on sync status & health changes.
- [ ] Backup/restore of Argo CD configs & projects; disaster recovery plan.
- [ ] Upgrade Argo CD (manifests/helm chart) on a cadence; test on a staging cluster first.

**Governance**
- [ ] Enforce policies via AppProject & admission controls (OPA/Gatekeeper/Kyverno).
- [ ] Protect prod branches; require PR reviews.
- [ ] Document promotion flow and rollback procedures.

---

## Where this lesson fits

This repo includes:
- **scripts-windows/** & **scripts-macos/** — install Argo CD, port-forward UI, fetch admin password, apply sample Applications, optional NodePort, and cleanup.
- **applications/** — ready-made examples:
  - `approject-lesson.yaml` — a restricted **AppProject**.
  - `application-guestbook.yaml` — tracks `argocd-example-apps/guestbook` and auto-creates namespace.
  - `app-of-apps.yaml` — demonstrates the **App of Apps** pattern.

**Start here:**
1. Install Argo CD (`scripts-*/install-argocd*`).
2. Port-forward UI & grab the admin password.
3. Apply `approject-lesson.yaml` and `application-guestbook.yaml`.
4. Make a small change in Git (e.g., update image tag) and watch Argo CD sync it.

---

## Useful commands (CLI)

> The UI does everything below, but CLI is great for pipelines/local testing.

```bash
# Login (after port-forward to 8080)
argocd login localhost:8080 --username admin --password <pass> --insecure

# List apps
argocd app list

# Create an app (example—adjust repo/path/namespace)
argocd app create myapp   --repo https://github.com/org/repo.git   --path k8s/overlays/dev   --dest-server https://kubernetes.default.svc   --dest-namespace myapp-dev   --project lesson

# Sync now & watch
argocd app sync myapp
argocd app get myapp
```

---

## Mental model

Think of Argo CD as an **idempotent reconciler**:
- You declare desired state in **Git**.
- Argo CD continuously **diffs** desired vs. live.
- When different, it **applies** changes (or waits for you to click **Sync**).
- If someone “kubectl edits” a live object, **drift detection** flags it and (optionally) **self-heal** puts it back.