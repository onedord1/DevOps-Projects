# =============================================================================
#  Progressive Delivery Platform — operator entrypoint
#
#  This Makefile is the single front door for every workflow. Targets are
#  grouped by phase and self-document via `make help`. Targets for unbuilt
#  phases print a friendly "coming in phase N" notice instead of failing,
#  so the interface is stable as the platform grows.
# =============================================================================

SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

# ---- configuration ----------------------------------------------------------
REPO_ROOT  := $(shell cd "$(dir $(lastword $(MAKEFILE_LIST)))" && pwd)
SCRIPTS    := $(REPO_ROOT)/scripts
CLUSTER    ?= acme-platform
K8S_VERSION ?= v1.30.0

export REPO_ROOT

# ---- pretty help ------------------------------------------------------------
# Use `## <group>: description` after a target to register it in help.
.PHONY: help
help: ## meta: show this help
	@printf '\n\033[1mProgressive Delivery Platform\033[0m — make targets\n\n'
	@grep -hE '^[a-zA-Z0-9_.-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@printf '\n'

# =============================================================================
#  Phase 1 — Foundation
# =============================================================================
.PHONY: check-tools
check-tools: ## setup: verify required local toolchain is installed
	@bash "$(SCRIPTS)/check-tools.sh"

.PHONY: lint-scripts
lint-scripts: ## setup: syntax-check all shell scripts (and shellcheck if available)
	@set -e; \
	files=$$(find "$(REPO_ROOT)" -name '*.sh' -not -path '*/.*'); \
	for f in $$files; do \
		bash -n "$$f" && printf '  ok  %s\n' "$$f"; \
	done; \
	if command -v shellcheck >/dev/null 2>&1; then \
		shellcheck -x $$files && echo "shellcheck: clean"; \
	else \
		echo "shellcheck not installed — skipped (optional)"; \
	fi

.PHONY: docs
docs: ## docs: list documentation entrypoints
	@printf 'Documentation:\n'
	@printf '  README.md                      project overview\n'
	@printf '  docs/PHASES.md                 delivery roadmap + status\n'
	@printf '  docs/architecture/overview.md  architecture + diagrams\n'
	@printf '  docs/adr/                      architecture decision records\n'

# =============================================================================
#  Phase 2 — Local Kubernetes (k3s)
# =============================================================================
KUBECONFIG_PATH := $(REPO_ROOT)/clusters/.kubeconfig
BOOTSTRAP       := $(REPO_ROOT)/clusters/bootstrap

.PHONY: up
up: ## cluster: create local k3s cluster + registry + ingress + namespaces
	@bash "$(BOOTSTRAP)/bootstrap.sh"

.PHONY: down
down: ## cluster: tear down k3s cluster, registry and kubeconfig
	@bash "$(BOOTSTRAP)/teardown.sh"

.PHONY: cluster-info
cluster-info: ## cluster: read-only health summary of the local platform
	@bash "$(BOOTSTRAP)/verify.sh"

.PHONY: kubeconfig
kubeconfig: ## cluster: print the command to use this cluster's kubeconfig
	@if [ -f "$(KUBECONFIG_PATH)" ]; then \
		printf 'export KUBECONFIG=%s\n' "$(KUBECONFIG_PATH)"; \
	else \
		printf '\033[33m[notice]\033[0m no kubeconfig yet — run: make up\n'; \
	fi

# =============================================================================
#  Later phases — stable interface, implemented just-in-time
# =============================================================================
.PHONY: build-apps
build-apps: ## apps: build (PUSH=1 to push) Acme service images into the local registry
	@bash "$(SCRIPTS)/build-apps.sh"

.PHONY: test-apps
test-apps: ## apps: run Go vet + build for all services
	@cd "$(REPO_ROOT)/apps" && go vet ./... && go build ./... && echo "apps: vet + build clean"

.PHONY: compose-up
compose-up: ## apps: run the full stack locally via docker compose (NATS + services)
	@docker compose -f "$(REPO_ROOT)/apps/deploy/docker-compose.yaml" up --build -d
	@printf 'storefront: http://localhost:8080\n'

.PHONY: compose-down
compose-down: ## apps: stop the local docker compose stack
	@docker compose -f "$(REPO_ROOT)/apps/deploy/docker-compose.yaml" down

# =============================================================================
#  Phase 4 — Infrastructure as Code (Terraform)
# =============================================================================
ENV     ?= dev
INFRA   := $(REPO_ROOT)/infra
ENV_DIR  = $(INFRA)/environments/$(ENV)

.PHONY: tf-fmt
tf-fmt: ## infra: check Terraform formatting across infra/
	@terraform fmt -check -recursive "$(INFRA)" && echo "terraform fmt: clean"

.PHONY: tf-validate
tf-validate: ## infra: validate an environment (ENV=dev|staging|prod), no credentials needed
	@test -d "$(ENV_DIR)" || { printf '\033[31munknown ENV=%s\033[0m\n' "$(ENV)"; exit 1; }
	@cd "$(ENV_DIR)" && terraform init -backend=false -input=false >/dev/null && terraform validate

.PHONY: tf-plan
tf-plan: ## infra: terraform plan for an environment (ENV=dev|staging|prod); needs creds + backend
	@cd "$(ENV_DIR)" && terraform plan -var-file=$(ENV).tfvars

.PHONY: tf-apply
tf-apply: ## infra: terraform apply for an environment (ENV=...); needs creds + backend
	@cd "$(ENV_DIR)" && terraform apply -var-file=$(ENV).tfvars

.PHONY: observability
observability: ## obs: install Prometheus/Grafana/Loki/Alloy/OTel into the cluster
	@bash "$(REPO_ROOT)/observability/install.sh"

.PHONY: observability-down
observability-down: ## obs: remove the observability stack (CRDs left intact)
	@bash "$(REPO_ROOT)/observability/uninstall.sh"

.PHONY: gitops
gitops: ## gitops: install Argo CD + bootstrap the app-of-apps
	@bash "$(REPO_ROOT)/gitops/install.sh"

.PHONY: gitops-down
gitops-down: ## gitops: remove Argo CD and all GitOps-managed apps
	@bash "$(REPO_ROOT)/gitops/uninstall.sh"

.PHONY: rollouts
rollouts: ## delivery: install Argo Rollouts + Gateway API plugin + RBAC
	@bash "$(REPO_ROOT)/rollouts/install.sh"

.PHONY: rollouts-demo
rollouts-demo: ## delivery: show the progressive-delivery demo commands
	@bash "$(REPO_ROOT)/rollouts/demo.sh" help

# =============================================================================
#  Phase 8 — CI/CD & DevSecOps
# =============================================================================
.PHONY: ci-validate
ci-validate: ## ci: validate the GitLab pipeline YAML + release tag-bump logic
	@bash "$(REPO_ROOT)/ci/validate.sh"

# =============================================================================
#  Phase 9 — SLOs, Incidents & Reporting
# =============================================================================
.PHONY: slo-generate
slo-generate: ## slos: generate Prometheus SLO rules from Sloth definitions in slos/sloth/
	@bash "$(REPO_ROOT)/slos/generate.sh"

.PHONY: deploy-report
deploy-report: ## slos: print a deployment health report (SLIs + incidents, last 24h)
	@bash "$(REPO_ROOT)/slos/deploy-report.sh"

.PHONY: demo
demo: ## demo: run guided end-to-end demo (phase 10)
	@$(call coming_soon,10,Demos and fault injection)

# ---- helpers ----------------------------------------------------------------
# coming_soon <phase> <name>
define coming_soon
	printf '\033[33m[notice]\033[0m "%s" lands in Phase %s. See docs/PHASES.md\n' "$(2)" "$(1)"
endef
