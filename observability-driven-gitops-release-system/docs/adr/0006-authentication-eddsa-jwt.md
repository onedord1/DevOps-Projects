# ADR-0006: Authentication with EdDSA (Ed25519) JWTs

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE, Security
- **Supersedes:** —
- **Superseded by:** —

## Context

The Acme services need service-to-service and user authentication that is **lightweight and modern** for a 2026 demo, without standing up a heavy identity provider. In a microservices topology many services must independently verify a caller's token, so a shared symmetric secret is undesirable (any verifier could forge tokens). Current best practice favors **asymmetric** signing (RS256/ES256/**EdDSA**) so verifiers hold only a public key.

Options: shared-secret JWT (HS256), asymmetric JWT (EdDSA/ES256), PASETO/Branca, or a full OIDC provider (e.g. Zitadel/Keycloak).

## Decision

Use **JWTs signed with EdDSA (Ed25519)**. The frontend BFF is the **issuer** (holds the private key, mints tokens on login, serves a **JWKS** endpoint at `/.well-known/jwks.json`). Every other service is a **verifier** that validates tokens with the public key only.

For the local/demo inner loop, all services derive the same Ed25519 key pair from a shared 32-byte seed (`AUTH_SEED`) so verification works with zero configuration. In a real deployment the private key is managed (Secret/KMS) and the public key is distributed via JWKS; an external **OIDC provider (Zitadel)** is the documented upgrade path.

Validation enforces issuer, audience, expiry, and the `EdDSA` algorithm only (preventing `alg` confusion/`none` attacks).

## Consequences

### Positive
- Verifiers cannot forge tokens (asymmetric); no shared secret to leak.
- EdDSA is fast, small, and modern — short keys/signatures, no curve-parameter foot-guns.
- Stateless verification: services validate locally, no per-request IdP call.
- Clear migration path to OIDC without changing the verification model (JWT + JWKS).

### Negative / trade-offs
- Token revocation is not immediate (mitigated by short TTLs).
- Key rotation requires JWKS `kid` handling (the `kid` is already emitted).
- The shared-seed dev convenience must never leak into production (documented, default flagged insecure).

### Follow-ups
- Phase 7+: distribute the issuer public key via a Kubernetes Secret / JWKS rather than a shared seed.
- Document the Zitadel/OIDC integration as the enterprise option.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| HS256 (shared secret) | Any verifier can mint tokens; poor fit for many services. |
| OIDC provider (Zitadel/Keycloak) | Best for production, but heavy for a local demo; kept as upgrade path. |
| PASETO / Branca | Modern and safe, but smaller ecosystem/tooling than JWT+JWKS in 2026. |
| ES256 (ECDSA P-256) | Fine choice; EdDSA preferred for simpler, misuse-resistant implementation. |
