# Architecture Decision Records (ADRs)

An **Architecture Decision Record** captures a single significant architectural decision, its context, and its consequences. We use ADRs so that *why* a choice was made survives long after the people who made it — a core practice on a healthy platform team.

## Format

Each ADR follows the lightweight [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

- **Status** — Proposed · Accepted · Superseded · Deprecated
- **Context** — the forces at play
- **Decision** — what we chose
- **Consequences** — the trade-offs we accept

## Conventions

- ADRs are **immutable** once Accepted. To change a decision, write a new ADR that supersedes the old one and update both `Status` fields.
- Numbering is sequential and zero-padded (`0001`, `0002`, …).
- New ADRs start from [`template.md`](./template.md).

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](./0002-progressive-delivery-with-argo-rollouts.md) | Progressive delivery with Argo Rollouts | Accepted |
| [0003](./0003-observability-driven-promotion.md) | Observability-driven promotion & rollback | Accepted |
| [0004](./0004-local-platform-k3s.md) | Local platform on k3s with ingress-nginx | Accepted¹ |
| [0005](./0005-gateway-api-envoy-gateway.md) | Use Gateway API (Envoy Gateway) instead of ingress-nginx | Accepted |
| [0006](./0006-authentication-eddsa-jwt.md) | Authentication with EdDSA (Ed25519) JWTs | Accepted |
| [0007](./0007-messaging-nats-jetstream.md) | Event messaging with NATS JetStream | Accepted |

¹ ADR-0004's ingress-nginx decision is superseded by ADR-0005; its k3s/registry/kubeconfig decisions still stand.
