#!/usr/bin/env bash
#
# verify-signature.sh — verify a keyless Cosign signature + SBOM attestation for
# an Acme image. Run by an operator (or an admission policy) to confirm an image
# was built and signed by THIS project's GitLab pipeline.
#
#   IMAGE=registry.gitlab.com/acme/platform/payment@sha256:... \
#   OIDC_ISSUER=https://gitlab.com \
#   IDENTITY_REGEXP='https://gitlab.com/acme/.+' \
#   bash ci/scripts/verify-signature.sh
#
# Keyless verification checks the Sigstore transparency-log entry and that the
# signing certificate's identity (the pipeline) and OIDC issuer match.

set -Eeuo pipefail

IMAGE="${IMAGE:?set IMAGE=<repo>@sha256:<digest> (always verify by digest)}"
OIDC_ISSUER="${OIDC_ISSUER:-https://gitlab.com}"
IDENTITY_REGEXP="${IDENTITY_REGEXP:-https://gitlab.com/.+}"

command -v cosign >/dev/null 2>&1 || { echo "cosign not found on PATH"; exit 1; }

echo "==> Verifying signature for ${IMAGE}"
cosign verify \
  --certificate-oidc-issuer "${OIDC_ISSUER}" \
  --certificate-identity-regexp "${IDENTITY_REGEXP}" \
  "${IMAGE}"

echo "==> Verifying SPDX SBOM attestation"
cosign verify-attestation \
  --type spdxjson \
  --certificate-oidc-issuer "${OIDC_ISSUER}" \
  --certificate-identity-regexp "${IDENTITY_REGEXP}" \
  "${IMAGE}"

echo "OK: signature and SBOM attestation verified."
