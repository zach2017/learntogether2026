# Resilience Plan & Runbooks

**System:** System  
**Environment:** n/a  
**RTO:** —h • **RPO:** —m

## Strategy
### Business Objectives
- Define critical services, data classes, and SLOs with error budgets.
- Map RTO/RPO to each service; document failover order and dependencies.

### Architecture Resilience
- Multi‑AZ/region where feasible; graceful degradation; feature flags for risky paths.
- State isolation: separate read/write, apply backpressure, and implement bulkheads.

### Backups & DR
- 3‑2‑1 backups; encrypt at rest; immutable backups for ransomware.
- Restore‑test schedule: monthly full, weekly differential, daily incremental.

### Observability & Response
- OpenTelemetry traces/metrics/logs; golden signals dashboards; anomaly alerts.
- On‑call runbooks (this doc); paging policies; exec comms templates.

### Security Controls
- SSO/MFA; least privilege; network segmentation; WAF/IDS/IPS; egress control.
- SBOM, signed artifacts, dependency/container scanning, policy as code.

## Runbooks
## CVE Tasks
## Best Practices
### web
- Enforce HTTPS (TLS 1.2+) with HSTS; use modern ciphers and disable TLS 1.0/1.1.
### api
- Implement OAuth2/OIDC with short‑lived access tokens, refresh tokens, and PKCE for public clients.
- Rate limit and apply circuit breakers; include idempotency keys for mutating requests.
### frontend
- Set strict CSP, SRI, X‑Content‑Type‑Options, Referrer‑Policy, and disable inline scripts.
- Use SAMEORIGIN iframes, secure cookies (HttpOnly, Secure, SameSite=Lax/Strict).
### backend
- Adopt input validation + output encoding; leverage parameterized queries and ORM escaping.
- Use secrets manager (no secrets in env vars), rotate keys, and enforce mTLS for east‑west.
### db
- Encrypt data at rest and in transit; use least‑privilege roles and row‑level security if available.
### ops
- Zero‑Trust: strong device posture, SSO + MFA, just‑in‑time privileged access, session recording.
- Backups: 3‑2‑1 strategy, cross‑region, periodic restore tests; document RPO/RTO.
- Observability: OpenTelemetry traces + metrics + logs; anomaly detection and SLOs with error budgets.
- Supply chain: SBOM (CycloneDX), signed artifacts (Sigstore), dependency scanning, container scanning.
### platform
- Harden base OS (CIS), auto‑patch kernel/userspace; enable ASLR/DEP, auditd, and FIM.
- Use container sandboxing (seccomp, AppArmor) and minimal distros (distroless).
### network
- Segment with L3/L7 policies; WAF for edge, IDS/IPS, egress allow‑lists, DNS sinkhole for C2.