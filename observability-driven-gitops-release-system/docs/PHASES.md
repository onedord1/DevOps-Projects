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
| 5 | Observability Stack | ✅ | Prometheus, Grafana, Loki, Alloy, OTel Collector + Acme SLI rules/dashboards |
| 6 | GitOps with Argo CD | ✅ | Argo CD app-of-apps managing observability + Acme (Kustomize), sync-wave ordered |
| 7 | Progressive Delivery | ✅ | Argo Rollouts canary (5→20→50→100%) + 8 reusable AnalysisTemplates, auto promote/rollback |
| 8 | CI/CD & DevSecOps | ✅ | GitLab CI: Buildah build → Trivy gate → Syft SBOM → Cosign keyless sign → GitOps bump |
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

### Phase 5 — Observability Stack ✅

1. **Objective** — Stand up the metrics/logs/traces/alerting foundation that the SLO-gated rollouts depend on, with Acme-specific SLIs, dashboards, and alerts.
2. **Architecture** — Helm-installed into `monitoring`: `kube-prometheus-stack` (Prometheus Operator, Prometheus, Alertmanager, Grafana, node-exporter, kube-state-metrics), Loki (single-binary), Alloy (log DaemonSet), OpenTelemetry Collector (OTLP gateway). Prometheus discovers ServiceMonitors/PrometheusRules cluster-wide; recording rules expose `acme:*` SLIs. See [observability/README.md](../../observability/README.md).
3. **Design decisions** — [ADR-0009](./adr/0009-observability-stack.md): kube-prometheus-stack for the metrics/alerting/dashboards core; Loki for logs; **Alloy instead of EOL Promtail**; OTel Collector for traces (Tempo as documented drop-in). Pinned chart versions.
4. **Files** — `observability/charts.env`, `observability/values/*.values.yaml` (4 charts), `observability/prometheus/{servicemonitor-acme.yaml,rules/*}`, `observability/grafana/dashboards/acme-overview.json`, `observability/promql/examples.md`, `observability/{install,uninstall}.sh`, `observability/README.md`, Makefile `observability`/`observability-down`.
5. **Implementation** — Idempotent install of pinned charts + Acme ServiceMonitor, recording/alerting rules, and an auto-loaded Grafana dashboard; honorLabels preserves the app `service` label.
6. **Validation** — `make lint-scripts` clean; all values + PrometheusRule/ServiceMonitor YAML parse; dashboard is valid JSON. (`make observability` runs against a live cluster.)
7. **Demo** — `make observability` → port-forward Grafana → view "Acme Platform — Service Overview"; inspect alerts in Alertmanager.
8. **Git commits** — `feat(observability): Prometheus/Grafana/Loki/Alloy/OTel stack + Acme SLIs (phase 5)`.
9. **README updates** — `observability/README.md` guide; status set to "Phase 5 complete".

### Phase 6 — GitOps with Argo CD ✅

1. **Objective** — Make Git the single source of truth: Argo CD continuously reconciles the observability stack and the Acme workloads from this repo.
2. **Architecture** — Helm-installed Argo CD (chart 10.0.0, app v3.4.4) + **app-of-apps**: a root Application watches `gitops/apps/`; child Applications install the four observability charts (multi-source Helm + git values) and the Acme Kustomize overlay. Two AppProjects (`platform`, `acme`) scope permissions; **sync waves** order CRDs→dependents. See [gitops/README.md](../../gitops/README.md).
3. **Design decisions** — [ADR-0010](./adr/0010-gitops-argocd.md): Argo CD over Flux; app-of-apps over pure ApplicationSet at this stage; multi-source Helm (charts upstream, values in git); Kustomize for the app; ESO (not Vault plugin) as the production secrets path.
4. **Files** — `gitops/charts.env`, `gitops/values/argocd.values.yaml`, `gitops/projects/*`, `gitops/bootstrap/root-app.yaml`, `gitops/apps/*.app.yaml` (6 children), `gitops/acme/{base,overlays/dev}/*`, `gitops/{install,uninstall,set-repo}.sh`, `gitops/README.md`, Makefile `gitops`/`gitops-down`.
5. **Implementation** — Automated sync (prune + selfHeal), ServerSideApply for kube-prometheus-stack CRDs, sync-wave ordering; Acme services deployed as Deployments + Service + HTTPRoute + NATS + auth Secret, labelled for the Phase 5 ServiceMonitor.
6. **Validation** — `make lint-scripts` clean; all 18 GitOps YAML files parse; `kubectl kustomize gitops/acme/overlays/dev` builds (5 services + NATS, images remapped, `part-of` label on Services without touching selectors).
7. **Demo** — `PUSH=1 make build-apps` → `make gitops` → watch `kubectl -n argocd get applications -w` converge → browse storefront + Grafana.
8. **Git commits** — `feat(gitops): Argo CD app-of-apps managing observability + Acme (phase 6)`.
9. **README updates** — `gitops/README.md` guide; status set to "Phase 6 complete".

### Phase 7 — Progressive Delivery ⬜

Argo Rollouts canary strategy (5 → 20 → 50 → 100%), the full reusable `AnalysisTemplate` set (HTTP success, 5xx, P95 latency, restarts, CPU, memory, payment success, checkout success), and automatic abort/rollback wiring.

### Phase 7 — Progressive Delivery ✅

1. **Objective** — Close the auto-promote/auto-rollback loop: canary Rollouts gated by Prometheus SLO analysis scoped to the canary pods.
2. **Architecture** — Argo Rollouts (chart 2.41.0, app v1.9.0) + Gateway API traffic-router plugin (v0.15.0). `frontend` canaries via HTTPRoute weights; `payment`/`order`/`inventory` via replica-based canary; `notification` stays a Deployment. 8 reusable AnalysisTemplates query the Phase 5 Prometheus, filtered by `rollouts_pod_template_hash`. See [rollouts/README.md](../../rollouts/README.md).
3. **Design decisions** — [ADR-0011](./adr/0011-progressive-delivery-analysis.md): 5→20→50→100% steps with inter-step analysis; canary isolation via `podTargetLabels`; parameterized templates with per-service SLO composition; no-data-safe success conditions.
4. **Files** — `rollouts/values/argo-rollouts.values.yaml`, `rollouts/rbac/gateway-plugin-rbac.yaml`, `rollouts/{install,demo}.sh`, `rollouts/README.md`, `gitops/acme/base/analysis/*` (8 templates), Rollout conversions of frontend/payment/order/inventory, `gitops/apps/{05-argo-rollouts,06-rollouts-rbac}.app.yaml`, ServiceMonitor `podTargetLabels`, Makefile `rollouts`/`rollouts-demo`.
5. **Implementation** — Rollouts replace Deployments; frontend gets stable/canary Services + weighted HTTPRoute; analysis composed per service (RED + business SLOs + resource guardrails); GitOps-managed (sync-waves -25/-24 before workloads).
6. **Validation** — `make lint-scripts` clean; all YAML parse; `kubectl kustomize` builds 4 Rollouts + 8 AnalysisTemplates + canary/stable Services + weighted HTTPRoute, with `part-of` label applied and Pod selectors untouched.
7. **Demo** — `rollouts/demo.sh load` → `promote frontend v2` (healthy canary) → `bad-payment` (SLO breach → automatic rollback).
8. **Git commits** — `feat(rollouts): Argo Rollouts canary + reusable AnalysisTemplates (phase 7)`.
9. **README updates** — `rollouts/README.md` guide; status set to "Phase 7 complete".

### Phase 8 — CI/CD & DevSecOps ⬜

GitLab CI pipeline: build → Trivy scan → Syft SBOM → Cosign sign → push → GitOps bump. Security gates fail the pipeline on policy violation.

### Phase 8 — CI/CD & DevSecOps ✅

1. **Objective** — Guarantee only scanned, SBOM'd, and signed artifacts reach deployment, with a GitOps handoff that triggers the Phase 7 canaries.
2. **Architecture** — Matrixed GitLab pipeline (`build → scan → sbom → sign → release`) across all five services: Buildah rootless build (push by digest), Trivy gate, Syft SBOMs, Cosign keyless sign + SBOM attestation (GitLab OIDC + Sigstore), then a manual GitOps tag-bump. See [ci/README.md](../../ci/README.md).
3. **Design decisions** — [ADR-0012](./adr/0012-devsecops-supply-chain.md): Buildah over Kaniko/dind; keyless Cosign over keyed; sign the digest not the tag; Trivy gates on fixable HIGH/CRITICAL; CI bumps the overlay (no direct cluster access).
4. **Files** — `ci/.gitlab-ci.yml`, `ci/scripts/verify-signature.sh`, `ci/validate.sh`, `ci/README.md`, Makefile `ci-validate`.
5. **Implementation** — Pinned tools (Buildah v1.43, Trivy 0.71.2, Syft v1.46.0, Cosign v3.1.1); `id_tokens` keyless signing; GitLab container-scanning + CycloneDX reports; `release` job edits the dev overlay `newTag` and pushes via `GITOPS_PUSH_TOKEN`.
6. **Validation** — `make lint-scripts` clean; `make ci-validate` confirms the pipeline YAML (stages/jobs) and that the release `sed` bumps all 5 service tags. (Pipeline executes on a GitLab runner, not in-sandbox.)
7. **Demo** — Set the CI config path + `GITOPS_PUSH_TOKEN`; push/MR runs build→scan→sbom→sign; run `release` to ship; verify with `ci/scripts/verify-signature.sh`.
8. **Git commits** — `feat(ci): GitLab DevSecOps pipeline — build/scan/sbom/sign/release (phase 8)`.
9. **README updates** — `ci/README.md` guide; status set to "Phase 8 complete".

### Phase 9 — SLOs, Incidents & Reporting ⬜

SLO/error-budget definitions, automated incident creation on rollback, Grafana dashboard annotations on deploy events, and generated deployment reports.

### Phase 10 — Demos, Faults & Hardening ⬜

Fault-injection scenarios (latency, 5xx, OOM, crash-loop), guided demo scripts, screenshot checklist, end-to-end test scenarios, and troubleshooting runbooks.
