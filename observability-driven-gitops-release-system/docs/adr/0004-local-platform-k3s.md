# ADR-0004: Local platform on k3s with ingress-nginx

- **Status:** Accepted (the ingress-nginx decision is superseded by [ADR-0005](./0005-gateway-api-envoy-gateway.md))
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** [ADR-0005](./0005-gateway-api-envoy-gateway.md) (ingress portion only)

## Context

The platform needs a reproducible local Kubernetes environment for development and demos. Phase 1 tentatively named Kind; on review we want an environment that is closer to how a real cluster behaves (a `systemd`-managed kubelet, real node, bundled metrics-server, a CNI, and an embedded datastore) while staying laptop-friendly and single-binary simple.

Options considered: **Kind** (Kubernetes-in-Docker), **k3s** (lightweight CNCF-certified distribution), **RKE2** (hardened, security-focused distribution).

Separately, progressive delivery (ADR-0002) needs a **traffic router** that Argo Rollouts supports for weighted canary steps. k3s bundles **Traefik** by default; the most widely documented Argo Rollouts canary path uses **ingress-nginx** canary annotations.

## Decision

Use **k3s** as the local Kubernetes distribution, pinned to a specific version and installed via the official installer behind our own idempotent bootstrap scripts.

- Disable the bundled **Traefik** and install **ingress-nginx** instead, for predictable, well-documented Argo Rollouts canary traffic weighting.
- Keep k3s **servicelb (klipper-lb)** enabled so the ingress-nginx `LoadBalancer` Service receives the node IP and is reachable on `localhost`.
- Run a **local Docker registry** and wire k3s containerd to it via `registries.yaml`, so the build→push→deploy loop works without an external registry.
- Write a **repo-local, gitignored kubeconfig** (`clusters/.kubeconfig`) instead of mutating `~/.kube/config`, keeping the developer's other clusters untouched.

RKE2 remains the natural choice for a hardened production target and can be introduced later (e.g. via Terraform in Phase 4) without changing the application or GitOps layers.

## Consequences

### Positive
- Behaves like a real cluster (systemd kubelet, real node, bundled metrics-server, Flannel CNI).
- Single binary, fast install/uninstall (`k3s-uninstall.sh`), reproducible via pinned version.
- Local registry enables a fully offline inner loop.
- ingress-nginx gives us a documented canary traffic-routing story for Phase 7.
- Non-destructive kubeconfig handling avoids clobbering the developer's existing contexts.

### Negative / trade-offs
- Requires Linux + `sudo` (k3s installs a system service) — not as isolated as Kind's containers.
- Disabling Traefik means we own the ingress-nginx lifecycle.
- Single-node by default; multi-node HA is out of scope locally (covered conceptually by Terraform/RKE2 later).

### Follow-ups
- Phase 4 documents the production topology (RKE2/managed cluster) in Terraform.
- Phase 7 wires ingress-nginx as the Argo Rollouts traffic router.

## Alternatives considered

| Option | Why not chosen (for local) |
|---|---|
| Kind | Great for CI, but k3s is closer to real node behavior and ships metrics-server, servicelb, and a CNI. |
| RKE2 | Heavier and security-hardened; better suited to the production target than a laptop inner loop. |
| Keep bundled Traefik | Workable, but ingress-nginx canary annotations are the most documented Argo Rollouts path. |
