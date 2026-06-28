# syntax=docker/dockerfile:1.9
#
# One parameterized multi-stage build for all five Acme services. Build a
# specific service with:
#
#   docker build --build-arg SERVICE=payment -t localhost:5000/acme/payment:dev .
#
# Stage 1 compiles a static, CGO-free binary with build caching.
# Stage 2 is a distroless, non-root runtime — no shell, minimal attack surface.

ARG GO_VERSION=1.26
FROM golang:${GO_VERSION}-bookworm AS build

WORKDIR /src

# Cache modules first for fast incremental builds.
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

ARG SERVICE
ARG VERSION=dev
RUN test -n "${SERVICE}" || (echo "ERROR: --build-arg SERVICE=<name> is required" && exit 1)
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux \
    go build -trimpath -ldflags="-s -w -X main.version=${VERSION}" \
      -o /out/service ./services/${SERVICE}

# ----------------------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

ARG SERVICE
ARG VERSION=dev
LABEL org.opencontainers.image.title="acme-${SERVICE}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.source="https://example.com/acme/platform" \
      org.opencontainers.image.vendor="Acme Commerce Platform Engineering"

WORKDIR /
COPY --from=build /out/service /service

# Distroless nonroot runs as uid 65532.
USER nonroot:nonroot
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["/service"]
