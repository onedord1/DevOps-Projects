# Multi-stage build for Notification Service
FROM rust:1.90-alpine AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy workspace files
COPY Cargo.toml ./
COPY shared ./shared
COPY services ./services

# Enable sqlx offline mode to skip database connection during build
ENV SQLX_OFFLINE=true

# Build the application
RUN cargo build --release --package notification

# Runtime stage
FROM alpine:latest

RUN apk add --no-cache libgcc openssl ca-certificates

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/notification /app/notification

# Run the application
CMD ["/app/notification"]
