# ADR-0010: GitOps with Argo CD (app-of-apps + sync waves)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

Git is the single source of truth for the platform (ADR-0001 principle). We need a controller that continuously reconciles the cluster to Git, detects drift, and orders dependent installs (e.g. the Prometheus Operator CRDs must exist before any `ServiceMonitor`/`PrometheusRule`). It must also be the foundation Argo Rollouts plugs into (ADR-0002).

Choices: **Argo CD** vs **Flux**; and how to organize many Applications: a single root **app-of-apps** vs **ApplicationSet** generators.

## Decision

Use **Argo CD** (chart 10.0.0, app v3.4.4), installed by Helm, with an **app-of-apps** bootstrap:

- A **root Application** watches `gitops/apps/` and reconciles every child `*.app.yaml` it finds. Adding a component later is one committed file — no manual `kubectl`.
- **Two AppProjects** scope permissions: `platform` (cluster-scoped, installs CRDs/operators into `monitoring`/`argocd`/`argo-rollouts`/`envoy-gateway-system`) and `acme` (namespaced, `acme` only).
- **Sync waves** order the rollout: kube-prometheus-stack (`-20`) → Loki (`-15`) → Alloy/OTel (`-10`) → observability config / rules (`-5`) → Acme workloads (`0`). This guarantees CRDs are healthy before dependents sync.
- **Multi-source Helm Applications**: the chart comes from its upstream Helm repo (pinned version), while `valueFiles` come from this Git repo via a `$values` source ref — so values stay version-controlled without vendoring charts.
- The **Acme app** is rendered from a **Kustomize** overlay (`gitops/acme/overlays/dev`), keeping image tags and env-specific settings in one place; CI bumps the tag via a Git commit (Phase 8).
- **Automated sync** with `prune` + `selfHeal`; `ServerSideApply` for the large kube-prometheus-stack CRDs.
- The committed `repoURL` points at this repository; `gitops/set-repo.sh` re-points a fork.

ApplicationSets remain enabled for future fan-out (e.g. per-environment or per-tenant), but the initial structure favors the explicit, readable app-of-apps.

## Consequences

### Positive
- One bootstrap command (`make gitops`) brings the entire platform under continuous reconciliation.
- Declarative, auditable, self-healing; drift is corrected automatically.
- Sync waves solve CRD/operator ordering deterministically.
- Values stay in Git next to the apps; charts stay upstream and pinned.
- Clean separation of privilege via AppProjects.

### Negative / trade-offs
- Argo CD runs `helm template` (not `install`/`upgrade`): Helm lookup and hooks behave differently; charts must be hook-idempotent.
- App-of-apps is more explicit (one file per app) than ApplicationSet generators; fine at this scale, revisit if it grows.
- Secrets are not solved here — the dev `AUTH_SEED` is in Git as a placeholder. Production must use **External Secrets Operator** (Argo maintainers recommend against the Vault plugin).

### Follow-ups
- Phase 7: add an Argo Rollouts Application + convert Acme Deployments to Rollouts; the acme app stays the same shape.
- Phase 8: CI commits image-tag bumps to the Kustomize overlay.
- Production: External Secrets Operator; front Argo CD with the Gateway + TLS (drop `server.insecure`).

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Flux | Excellent, but we standardize on the Argo ecosystem for first-class Argo Rollouts integration. |
| Pure ApplicationSet (no app-of-apps) | More powerful generators, but less readable for a curated, hand-maintained platform set at this stage. |
| Vendor charts into the repo | Heavy and noisy; multi-source keeps charts upstream + pinned, values in Git. |
| Argo CD Vault Plugin for secrets | Deprecated guidance; ESO keeps Argo ignorant of secret-store credentials. |
