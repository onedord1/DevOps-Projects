# Contributing

This repository is built and maintained the way an internal Platform Engineering team would run an internal product. These conventions keep it coherent as it grows.

## Phased delivery

Work proceeds **one phase at a time** (see [docs/PHASES.md](./docs/PHASES.md)). A phase is "done" only when it satisfies the nine-point checklist:

1. Objective stated
2. Architecture described (with a diagram)
3. Design decisions captured (ADR if significant)
4. Files enumerated
5. Complete, runnable implementation (no placeholders)
6. Validation steps that pass
7. Demo steps
8. Git commit(s)
9. README/PHASES status updated

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

feat(rollouts): add P95 latency AnalysisTemplate
fix(ci): fail pipeline on critical Trivy findings
docs(adr): record observability-driven promotion decision
chore: scaffold platform repository (phase 1)
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`.

## Architecture Decision Records

Any architecturally significant change needs an ADR. Copy [`docs/adr/template.md`](./docs/adr/template.md), number it sequentially, and link it from [`docs/adr/README.md`](./docs/adr/README.md).

## Code & manifest standards

- **No placeholders.** Everything committed must run.
- Shell scripts source `scripts/lib/common.sh`, use strict mode, and pass `make lint-scripts`.
- YAML is valid and, where applicable, `kubeconform`/`kustomize build` clean.
- Every document includes at least one diagram (Mermaid preferred).
- Prefer reusable, parameterized building blocks over copy-paste.

## Local checks before pushing

```bash
make check-tools     # toolchain present
make lint-scripts    # shell scripts valid
```
