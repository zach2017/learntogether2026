# Argo CD Intro Lesson — React + Node API + Postgres + GitHub Actions

**What this is:** A minimal, production-shaped sample that uses GitOps (Argo CD) to deploy a React app, Node/Express API, and Postgres DB.
CI builds/pushes images to GHCR and updates Kustomize image tags; Argo CD syncs automatically on commit.

- Frontend: React (Vite) built and served by Nginx, proxies `/api/*` to the API Service.
- API: Node/Express using `pg` to connect to Postgres.
- DB: Postgres 15 StatefulSet with a 1Gi PVC.
- GitOps: Kustomize base + dev overlay; Argo CD Application points to overlay.
- CI: GitHub Actions builds & pushes to GHCR, updates Kustomize tags via `kustomize edit set image`, and commits back to `main`.

> Windows users: see **README-WINDOWS.md** and the **scripts/** folder.
