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
| 2 | Local Kubernetes Platform | ✅ | Reproducible k3s cluster + registry + Gateway API (Envoy Gateway) + bootstrap automation |
| 3 | Acme Microservices | ✅ | 5 instrumented Go services (RED + business metrics), EdDSA auth, NATS events, distroless images |
| 4 | Infrastructure as Code (Terraform) | ✅ | Reusable AWS modules (VPC/EKS/ECR) + isolated per-env state (dev/staging/prod) |
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

### Phase 2 — Local Kubernetes Platform ✅

1. **Objective** — One command (`make up`) stands up a reproducible local Kubernetes platform ready for the observability, GitOps, and delivery layers.
2. **Architecture** — Single-node **k3s** (systemd service) with bundled metrics-server + Flannel CNI; **Gateway API v1.5** implemented by **Envoy Gateway** as a `LoadBalancer` (backed by k3s servicelb) for canary traffic routing; a **local Docker registry** wired into containerd via `registries.yaml`; platform namespaces `acme`, `argocd`, `monitoring`, `argo-rollouts`. See the diagram in [clusters/README.md](../../clusters/README.md).
3. **Design decisions** — [ADR-0004](./adr/0004-local-platform-k3s.md): k3s over Kind/RKE2 for local; repo-local gitignored kubeconfig (never touch `~/.kube/config`); pinned versions. [ADR-0005](./adr/0005-gateway-api-envoy-gateway.md): Gateway API + Envoy Gateway replace ingress-nginx for portable, annotation-free canary weighting.
4. **Files** — `clusters/k3s/{config,registries}.yaml`, `clusters/manifests/{namespaces,gateway}.yaml`, `clusters/bootstrap/{config.env,00-preflight,01-local-registry,02-install-k3s,03-namespaces,04-gateway-api,bootstrap,teardown,verify}.sh`, `clusters/README.md`, Makefile `up`/`down`/`cluster-info`/`kubeconfig` targets.
5. **Implementation** — Idempotent, strict-mode bash sourcing `scripts/lib/common.sh`; every step re-runnable; non-destructive kubeconfig handling.
6. **Validation** — `make lint-scripts` (syntax clean), YAML parses, `make up` → node Ready + namespaces Active + ingress Running + registry catalog reachable, confirmed via `make cluster-info`.
7. **Demo** — `make up` → `eval "$(make kubeconfig)"` → push `localhost:5000/nginx` → deploy to `acme` → `make cluster-info` → `make down`.
8. **Git commits** — `feat(cluster): local k3s platform with registry and ingress (phase 2)`.
9. **README updates** — Quick start expanded with Phase 2 bring-up; status set to "Phase 2 complete"; `clusters/README.md` operator guide added.

### Phase 3 — Acme Microservices ⬜

`frontend`, `payment`, `order`, `inventory`, `notification` — each instrumented with Prometheus metrics (RED + business SLO metrics), health/readiness probes, OTel tracing hooks, and a multi-stage Dockerfile.

### Phase 3 — Acme Microservices ✅

1. **Objective** — Five small, fully instrumented services that emit the exact RED and business metrics the platform's progressive-delivery analysis depends on, packaged as minimal container images.
2. **Architecture** — One Go module with shared `pkg/` libraries (app bootstrap, auth, events, obs, httpx, health, faults) and five `services/` (`frontend`, `payment`, `order`, `inventory`, `notification`). frontend is the BFF + auth issuer; order orchestrates inventory + payment and publishes `order.created` to NATS; notification consumes it. See the diagram in [apps/README.md](../../apps/README.md).
3. **Design decisions** — Go 1.26 + stdlib routing; Prometheus client + OpenTelemetry (otelhttp) for metrics/traces; [ADR-0006](./adr/0006-authentication-eddsa-jwt.md) EdDSA JWT auth (verify-only via JWKS); [ADR-0007](./adr/0007-messaging-nats-jetstream.md) NATS JetStream broker; distroless non-root static images via one parameterized Dockerfile.
4. **Files** — `apps/go.mod`, `apps/pkg/{app,auth,config,events,faults,health,httpx,logging,obs}`, `apps/services/{frontend,payment,order,inventory,notification}/main.go`, `apps/Dockerfile`, `apps/.dockerignore`, `apps/deploy/docker-compose.yaml`, `apps/README.md`, `scripts/build-apps.sh`, Makefile `build-apps`/`test-apps`/`compose-up`/`compose-down`.
5. **Implementation** — All services compile to static binaries; shared libraries keep each `main` thin. Env-driven 12-factor config and fault injection (`FAIL_RATE`/`LATENCY_MS`).
6. **Validation** — `make test-apps` (go vet + build clean); end-to-end smoke test confirmed login→products→checkout, cross-service JWT verification, 401 on missing token, and `FAIL_RATE=1` driving `payments_total{declined}` + `orders_total{failed}` (the rollback signal).
7. **Demo** — `make compose-up` → login → `/api/products` → `/api/checkout` (async notification via NATS) → `make compose-down`.
8. **Git commits** — `feat(apps): five instrumented Go microservices with EdDSA auth + NATS (phase 3)`.
9. **README updates** — `apps/README.md` operator guide; status set to "Phase 3 complete".

### Phase 4 — Infrastructure as Code ⬜

Terraform modules describing the production-equivalent cloud topology (network, cluster, registry, IAM), with `dev` environment wiring and remote-state guidance.

### Phase 4 — Infrastructure as Code ✅

1. **Objective** — Production-grade, reusable Terraform describing the cloud topology, deployable to multiple environments with isolated state.
2. **Architecture** — Reusable single-concern modules (`network` wrapping VPC `~> 6.6`, `eks` wrapping EKS `~> 21.0` Auto Mode, native `ecr`) composed per environment in `environments/{dev,staging,prod}`; each environment owns an isolated S3 state file (DynamoDB lock); a `bootstrap` stack creates the backend. See [infra/README.md](../../infra/README.md).
3. **Design decisions** — [ADR-0008](./adr/0008-terraform-structure.md): modules + per-environment directories over flat/workspaces/Terragrunt; reuse community modules over god-modules; AWS/EKS target; pinned `terraform >= 1.9`, AWS provider `~> 6.28`.
4. **Files** — `infra/modules/{network,eks,ecr}/*`, `infra/bootstrap/*`, `infra/environments/{dev,staging,prod}/*` (versions/providers/backend/main/variables/outputs + `<env>.tfvars` + `backend.hcl.example`), `infra/README.md`, Makefile `tf-fmt`/`tf-validate`/`tf-plan`/`tf-apply`.
5. **Implementation** — Identical composition per env; differences expressed only in tfvars (CIDR, AZs, NAT strategy, public/private API endpoint).
6. **Validation** — `terraform fmt -check -recursive` clean; `terraform init -backend=false && terraform validate` succeeded for `dev` and `staging` (transitively validating all three modules) and for `bootstrap`, against real providers (AWS v6.52) and pinned registry modules.
7. **Demo** — `make tf-fmt`; `make tf-validate ENV=dev`; (with creds) bootstrap backend → `make tf-plan ENV=dev`.
8. **Git commits** — `feat(infra): reusable Terraform modules + per-env state for AWS topology (phase 4)`.
9. **README updates** — `infra/README.md` operator guide; status set to "Phase 4 complete".

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
