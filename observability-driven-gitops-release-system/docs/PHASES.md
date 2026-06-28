# Delivery Roadmap & Status

This platform is built **incrementally**. Each phase is self-contained, validated, and committed before the next begins. This mirrors how a real Platform Engineering team delivers an internal product: in reviewable, runnable increments.

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🚧 | In progress |
| ⬜ | Planned |

## Phase summary

| # | Phase | Status | Outcome |
|---|---|---|---|
| 1 | Foundation & Scaffolding | ✅ | Repo skeleton, docs framework, ADR process, Makefile, tooling checks |
| 2 | Local Kubernetes Platform | ⬜ | Reproducible Kind cluster + bootstrap automation |
| 3 | Acme Microservices | ⬜ | 5 instrumented services with Dockerfiles + metrics |
| 4 | Infrastructure as Code (Terraform) | ⬜ | Cloud topology modules + environments |
| 5 | Observability Stack | ⬜ | Prometheus, Grafana, Loki, OTel, Alertmanager |
| 6 | GitOps with Argo CD | ⬜ | App-of-apps, desired-state repo structure |
| 7 | Progressive Delivery | ⬜ | Argo Rollouts canary + reusable AnalysisTemplates |
| 8 | CI/CD & DevSecOps | ⬜ | GitLab CI, Trivy, Syft (SBOM), Cosign signing |
| 9 | SLOs, Incidents & Reporting | ⬜ | Error budgets, incident automation, deploy reports |
| 10 | Demos, Faults & Hardening | ⬜ | Fault injection, demo scripts, troubleshooting polish |

---

## Phase detail

Every phase is documented against the same template:
**1. Objective · 2. Architecture · 3. Design decisions · 4. Files to generate · 5. Implementation · 6. Validation · 7. Demo · 8. Git commits · 9. README updates.**

### Phase 1 — Foundation & Scaffolding ✅

1. **Objective** — Establish a credible enterprise repository skeleton: documentation framework, decision-record process, a single Makefile entrypoint, reusable shell library, and toolchain verification — so every later phase plugs into a consistent structure.
2. **Architecture** — Documentation-as-code. The `Makefile` is the operator interface; `scripts/lib/common.sh` provides shared logging/guard utilities; `docs/` holds architecture, ADRs, and roadmap.
3. **Design decisions** — Captured as ADR-0001 (use ADRs), ADR-0002 (Argo Rollouts for progressive delivery), ADR-0003 (observability-driven promotion). Repo name normalized to all-hyphen lowercase for tooling safety.
4. **Files** — `README.md`, `Makefile`, `.gitignore`, `LICENSE`, `docs/PHASES.md`, `docs/architecture/overview.md`, `docs/adr/*`, `scripts/lib/common.sh`, `scripts/check-tools.sh`, `CONTRIBUTING.md`.
5. **Implementation** — See files above.
6. **Validation** — `make help` lists targets; `make check-tools` reports toolchain readiness; `bash -n` passes on all scripts.
7. **Demo** — Run `make help` then `make check-tools`.
8. **Git commits** — `chore: scaffold platform repository (phase 1)`.
9. **README updates** — Status set to "Phase 1 complete".

### Phase 2 — Local Kubernetes Platform ⬜

1. **Objective** — One command to stand up a reproducible multi-node Kind cluster with ingress, ready for the platform components.
2. **Architecture** — Kind config (control-plane + workers), NGINX ingress, local registry, namespaces for `acme`, `argocd`, `monitoring`.
3. **Design decisions** — Kind over kubeadm for laptop reproducibility; pin Kubernetes version; local registry to avoid external pulls.
4. **Files** — `clusters/kind/kind-config.yaml`, `clusters/bootstrap/*.sh`, namespace manifests, Makefile `up`/`down` targets.
5–9. Implemented when phase begins.

### Phase 3 — Acme Microservices ⬜

`frontend`, `payment`, `order`, `inventory`, `notification` — each instrumented with Prometheus metrics (RED + business SLO metrics), health/readiness probes, OTel tracing hooks, and a multi-stage Dockerfile.

### Phase 4 — Infrastructure as Code ⬜

Terraform modules describing the production-equivalent cloud topology (network, cluster, registry, IAM), with `dev` environment wiring and remote-state guidance.

### Phase 5 — Observability Stack ⬜

Prometheus (scrape + recording/alerting rules), Grafana (provisioned dashboards), Loki (logs), OpenTelemetry Collector (traces), Alertmanager (routing + inhibition). Example PromQL library.

### Phase 6 — GitOps with Argo CD ⬜

App-of-apps pattern, desired-state repository structure, sync policies, drift detection, and the separation between application source and deployment state.

### Phase 7 — Progressive Delivery ⬜

Argo Rollouts canary strategy (5 → 20 → 50 → 100%), the full reusable `AnalysisTemplate` set (HTTP success, 5xx, P95 latency, restarts, CPU, memory, payment success, checkout success), and automatic abort/rollback wiring.

### Phase 8 — CI/CD & DevSecOps ⬜

GitLab CI pipeline: build → Trivy scan → Syft SBOM → Cosign sign → push → GitOps bump. Security gates fail the pipeline on policy violation.

### Phase 9 — SLOs, Incidents & Reporting ⬜

SLO/error-budget definitions, automated incident creation on rollback, Grafana dashboard annotations on deploy events, and generated deployment reports.

### Phase 10 — Demos, Faults & Hardening ⬜

Fault-injection scenarios (latency, 5xx, OOM, crash-loop), guided demo scripts, screenshot checklist, end-to-end test scenarios, and troubleshooting runbooks.
