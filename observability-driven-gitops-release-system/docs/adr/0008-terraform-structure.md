# ADR-0008: Terraform repository structure (modules + environments)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

The platform needs Infrastructure as Code that is **production-grade, reusable, and maintainable across multiple environments**. Several layouts are common in 2026:

1. **Flat / single root** — everything in one configuration. Simple but one state file = huge blast radius and no environment isolation.
2. **Terraform workspaces** — one config, multiple workspaces. Shares code but state separation is implicit and easy to misuse (`terraform workspace select` mistakes hit prod).
3. **Modules + per-environment directories** — reusable modules in `modules/`, composed per environment in `environments/<env>/`, each with its own backend/state.
4. **Terragrunt** — DRY wrapper over Terraform with generated backends.

We also must choose whether to author cloud primitives from scratch or reuse community modules, and a target cloud. AWS/EKS is the most common portfolio target.

## Decision

Adopt the **modules + per-environment directories** layout on **AWS**:

- `infra/modules/{network,eks,ecr}` — reusable, single-concern modules. `network` and `eks` wrap the well-maintained `terraform-aws-modules/{vpc,eks}/aws` modules (pinned `~> 6.6` / `~> 21.0`); `ecr` uses native resources.
- `infra/environments/{dev,staging,prod}` — each composes the modules identically and differs **only by `*.tfvars`**. Each environment has an **isolated S3 state file** (distinct backend `key`) with DynamoDB locking, configured via a **partial backend** + `backend.hcl`.
- `infra/bootstrap` — a local-state stack that creates the S3 bucket + DynamoDB table the environments use.
- Pin `terraform >= 1.9` and AWS provider `~> 6.28` (required by the upstream modules).

EKS uses **Auto Mode** to keep node management out of scope while staying production-realistic.

## Consequences

### Positive
- **Environment isolation:** an apply targets exactly one environment's state — minimal blast radius.
- **Parity:** identical composition means `dev` mirrors `prod`; differences are explicit in tfvars.
- **Reuse without god-modules:** thin wrappers expose a curated, versioned contract; community modules carry the heavy, well-tested logic.
- **Verifiable without cloud access:** `fmt`/`validate` run in CI with no credentials.

### Negative / trade-offs
- The per-environment root files are near-duplicates (a small, deliberate amount of repetition). Terragrunt or code-gen could DRY this further if the environment count grows.
- One state per environment (not per component) keeps things simple now; very large estates may later split state per component (network/cluster/platform) for finer blast-radius control.
- Commitment to AWS for the concrete modules (the structure itself is cloud-agnostic).

### Follow-ups
- Add an `irsa`/Pod-Identity module when wiring controllers that need AWS permissions (Phase 6+).
- Consider per-component state splitting if the estate grows.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Flat single root | No environment isolation; dangerous shared state. |
| Workspaces | Implicit state separation; easy to apply to the wrong environment. |
| Terragrunt | Powerful and DRY, but adds a tool/dependency; native Terraform is more portable for a reference repo. |
| Hand-rolled VPC/EKS | Reinvents large, well-tested modules; higher maintenance and risk. |
