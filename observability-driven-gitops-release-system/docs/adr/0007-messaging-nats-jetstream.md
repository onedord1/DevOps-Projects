# ADR-0007: Event messaging with NATS JetStream

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

The platform needs asynchronous, decoupled communication: when an order is confirmed, the `notification` service should react without the `order` service calling it synchronously. The requirement explicitly asks for a **very lightweight** message broker. Candidates: **NATS (JetStream)**, **RabbitMQ**, **Apache Kafka/Redpanda**, **Redis Streams**.

## Decision

Use **NATS with JetStream** as the platform broker. NATS is a single, dependency-free binary with microsecond latencies; JetStream adds durable streams, at-least-once delivery, and replay on the same server. The `order` service publishes `order.created` / `order.failed`; the `notification` service consumes `order.created` via a durable consumer with explicit acks.

The wrapper (`pkg/events`) treats `NATS_URL=""` as a no-op so services run without a broker where appropriate, and remain fully event-driven when connected.

## Consequences

### Positive
- Extremely small footprint (one binary, minimal memory) — ideal for a laptop cluster.
- Durable, at-least-once delivery with replay via JetStream, no extra infrastructure.
- Simple operational model; first-class Kubernetes Helm chart for later phases.
- Clean decoupling enables the async edge of the architecture.

### Negative / trade-offs
- Not Kafka: very large-scale log retention / stream processing is out of scope.
- At-least-once delivery means consumers must be idempotent.
- Another stateful component to run (mitigated by NATS's small footprint).

### Follow-ups
- Phase 5/6: deploy NATS to the cluster (Helm) with JetStream persistence.
- Ensure notification handler idempotency as event volume grows.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| RabbitMQ | Capable, but heavier (Erlang VM) than the "very lightweight" requirement. |
| Kafka / Redpanda | Overkill for this scale; operationally heavier. |
| Redis Streams | Possible, but NATS JetStream is purpose-built for messaging with simpler durability semantics. |
