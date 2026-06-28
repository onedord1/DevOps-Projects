# ADR-0005: Use Gateway API (Envoy Gateway) instead of ingress-nginx

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** the ingress-nginx portion of [ADR-0004](./0004-local-platform-k3s.md)
- **Superseded by:** —

## Context

ADR-0004 chose ingress-nginx for north-south traffic. The Ingress API is effectively frozen and relies on controller-specific annotations for anything beyond basic routing — including canary weighting, which we need for progressive delivery (ADR-0002).

The **Kubernetes Gateway API** is now the next-generation standard, reaching **v1.5 (Standard channel, GA)** in April 2026. It models routing with first-class, portable resources (`GatewayClass`, `Gateway`, `HTTPRoute`) and expresses weighted traffic splitting natively via `HTTPRoute` `backendRefs[].weight` — exactly what canary releases require, with no annotation soup.

Crucially, **Argo Rollouts ships an official Gateway API traffic-router plugin** (`argoproj-labs/rollouts-plugin-trafficrouter-gatewayapi`) that drives canary steps by adjusting `HTTPRoute` backend weights. Standardizing on Gateway API now makes Phase 7 portable across any conformant implementation.

We need an implementation (the Gateway API is just the spec). Candidates: **Envoy Gateway**, **kgateway**, **NGINX Gateway Fabric**, **Cilium**, **Istio**, and **Traefik**.

## Decision

Adopt the **Kubernetes Gateway API (v1.5, Standard channel)** as the north-south traffic API, implemented by **Envoy Gateway (v1.8.1)**.

- Install the Gateway API CRDs explicitly (pinned, standard channel) so the contract is visible in the repo, matching the upstream getting-started guide.
- Install Envoy Gateway via its pinned Helm OCI chart, with its bundled Gateway API CRD install disabled (we own the CRDs).
- Define a cluster-scoped `GatewayClass` (`acme`) and a shared `Gateway` (`acme-gateway`, HTTP :80) in the `acme` namespace; per-service `HTTPRoute`s are added in later phases and weighted by Argo Rollouts in Phase 7.
- k3s **servicelb** provides the Gateway's `LoadBalancer` address locally, so **MetalLB is not required**.

The rest of ADR-0004 (k3s, local registry, repo-local kubeconfig) is unchanged.

## Consequences

### Positive
- Portable, standard, future-proof routing; no controller-specific annotations.
- Native weighted traffic splitting → clean, portable Argo Rollouts canary in Phase 7.
- Envoy data plane is battle-tested; rich L7 features (header/host/path routing, retries, timeouts) available as we grow.
- Role-oriented model (infra owns `Gateway`, app teams own `HTTPRoute`) mirrors platform/dev separation.

### Negative / trade-offs
- Envoy Gateway requires Helm (now a required tool).
- One more controller to learn vs. the familiar Ingress object.
- Gateway API has a steeper initial concept count (`GatewayClass`/`Gateway`/`HTTPRoute`).

### Follow-ups
- Phase 7 installs the Argo Rollouts Gateway API plugin and wires per-service `HTTPRoute` canary weights.
- Document the production implementation choice (Envoy Gateway is portable to managed clusters) in Phase 4.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| ingress-nginx (ADR-0004) | Frozen Ingress API; canary needs nonstandard annotations; not the strategic direction. |
| Traefik (bundled in k3s) | Supports Gateway API, but we want an explicit, portable, well-documented Envoy-based path. |
| Cilium Gateway | Excellent, but couples north-south routing to the CNI choice — heavier for a laptop. |
| Istio | Full mesh is more than this platform needs at the edge right now. |
| NGINX Gateway Fabric / kgateway | Viable; Envoy Gateway picked for its straightforward standalone install and Envoy data plane. |
