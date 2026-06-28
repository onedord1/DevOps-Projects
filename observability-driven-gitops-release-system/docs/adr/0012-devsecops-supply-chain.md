# ADR-0012: DevSecOps supply chain (GitLab CI, Trivy, Syft, Cosign)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE, Security
- **Supersedes:** —
- **Superseded by:** —

## Context

The platform must guarantee that only **scanned, attested, and signed** artifacts reach the cluster, and that promotion stays GitOps-driven (ADR-0010). Phase 8 builds the CI supply chain on **GitLab CI** (per the project's tool list). Several concrete choices: how to build images without a privileged Docker daemon, how to sign (keyed vs keyless), what to sign (tag vs digest), where security gates live, and how CI hands off to deployment.

## Decision

A matrixed GitLab pipeline — `build → scan → sbom → sign → release` — across the five services:

- **Build with Buildah** (`quay.io/buildah/stable:v1.43`), rootless, no Docker-in-Docker. The build records the **immutable digest**; every later stage references `repo@sha256:…`.
- **Scan with Trivy** (`0.71.2`). Two invocations: a full GitLab container-scanning report (non-blocking) and a **gate** that fails the pipeline on **fixable HIGH/CRITICAL** CVEs (`--exit-code 1 --ignore-unfixed`).
- **SBOM with Syft** (`v1.46.0`): SPDX-JSON (for the Cosign attestation) and CycloneDX-JSON (GitLab dependency list).
- **Sign + attest with Cosign** (`v3.1.1`) **keyless**: GitLab issues a short-lived OIDC token (`id_tokens: SIGSTORE_ID_TOKEN`, aud `sigstore`); Cosign uses Sigstore (Fulcio cert + Rekor log). We **sign the digest** and **attest the SPDX SBOM** — no long-lived private keys.
- **Release = GitOps bump**: a manual, default-branch job updates the Kustomize `newTag` in the dev overlay and pushes a commit. Argo CD syncs and Argo Rollouts canaries it. CI never touches the cluster directly.
- The pipeline lives at `ci/.gitlab-ci.yml` (subfolder repo → set the project's CI config path).

## Consequences

### Positive
- **Provenance + integrity:** every deployed image is scanned, SBOM'd, and cryptographically signed by an identifiable pipeline (SLSA-aligned).
- **No key management:** keyless signing removes private-key storage/rotation risk.
- **Tamper-resistant references:** signing/deploying by digest defeats tag-mutation attacks.
- **Clear separation:** CI proves artifact trust; GitOps + Rollouts own deployment and rollback.
- **Rootless builds:** Buildah avoids privileged dind.

### Negative / trade-offs
- Keyless signing depends on the public Sigstore (Fulcio/Rekor) being reachable; air-gapped sites need a private Sigstore or keyed signing.
- The `release` push needs a write-scoped token (`GITOPS_PUSH_TOKEN`) — a managed credential.
- Trivy gating can block releases on newly disclosed CVEs; teams need an allowlist/exception process.
- The dev overlay's registry (`localhost:5000`) differs from the CI registry; per-environment overlays resolve this (ECR for cloud).

### Follow-ups
- Phase 9/10: an admission policy (Kyverno / Sigstore policy-controller) that **refuses unsigned images** in-cluster, using `verify-signature.sh`'s identity/issuer.
- Add SLSA provenance attestation (`cosign attest --type slsaprovenance`) and Trivy config/IaC scanning.

## Alternatives considered

| Decision | Alternative | Why not |
|---|---|---|
| Builder | Kaniko | Lower maintenance upstream; Buildah is actively developed and rootless. |
| Builder | docker buildx + dind | Requires privileged runner; Buildah avoids it. |
| Signing | Keyed Cosign (KMS) | Key storage/rotation burden; keyless fits ephemeral CI and public OIDC. |
| Sign target | Tag | Tags are mutable; signing the digest is the secure choice. |
| Deploy | CI `kubectl apply` | Breaks GitOps; bumping the overlay keeps Git the source of truth. |
