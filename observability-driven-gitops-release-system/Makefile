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
	for f in $$(find "$(SCRIPTS)" -name '*.sh'); do \
		bash -n "$$f" && printf '  ok  %s\n' "$$f"; \
	done; \
	if command -v shellcheck >/dev/null 2>&1; then \
		shellcheck -x $$(find "$(SCRIPTS)" -name '*.sh') && echo "shellcheck: clean"; \
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
#  Phase 2 — Local Kubernetes  (stubs until implemented)
# =============================================================================
.PHONY: up
up: ## cluster: create local Kind cluster + bootstrap (phase 2)
	@$(call coming_soon,2,Local Kubernetes platform)

.PHONY: down
down: ## cluster: tear down local cluster (phase 2)
	@$(call coming_soon,2,Local Kubernetes platform)

.PHONY: cluster-info
cluster-info: ## cluster: show cluster status (phase 2)
	@$(call coming_soon,2,Local Kubernetes platform)

# =============================================================================
#  Later phases — stable interface, implemented just-in-time
# =============================================================================
.PHONY: build-apps
build-apps: ## apps: build microservice images (phase 3)
	@$(call coming_soon,3,Acme microservices)

.PHONY: tf-plan
tf-plan: ## infra: terraform plan for dev environment (phase 4)
	@$(call coming_soon,4,Infrastructure as Code)

.PHONY: observability
observability: ## obs: install Prometheus/Grafana/Loki/OTel stack (phase 5)
	@$(call coming_soon,5,Observability stack)

.PHONY: gitops
gitops: ## gitops: install Argo CD + app-of-apps (phase 6)
	@$(call coming_soon,6,GitOps with Argo CD)

.PHONY: rollouts
rollouts: ## delivery: install Argo Rollouts + AnalysisTemplates (phase 7)
	@$(call coming_soon,7,Progressive delivery)

.PHONY: demo
demo: ## demo: run guided end-to-end demo (phase 10)
	@$(call coming_soon,10,Demos and fault injection)

# ---- helpers ----------------------------------------------------------------
# coming_soon <phase> <name>
define coming_soon
	printf '\033[33m[notice]\033[0m "%s" lands in Phase %s. See docs/PHASES.md\n' "$(2)" "$(1)"
endef
