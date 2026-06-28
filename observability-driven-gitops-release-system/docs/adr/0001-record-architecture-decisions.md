# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** Platform Engineering, SRE
- **Supersedes:** —
- **Superseded by:** —

## Context

This platform spans many moving parts (GitOps, progressive delivery, observability, supply-chain security) and will be built over many phases by people who join at different times. Decisions made early — and the reasoning behind them — are easily lost, leading to "why is it like this?" churn and accidental reversals of deliberate choices.

## Decision

We will document every architecturally significant decision as an **Architecture Decision Record** stored in `docs/adr/`, using the Michael Nygard format. ADRs are immutable once Accepted; a decision is changed only by a new superseding ADR.

A decision is "architecturally significant" if it affects structure, cross-cutting concerns, dependencies, interfaces, or operational behavior of the platform.

## Consequences

### Positive
- Onboarding is faster: the *why* is written down next to the code.
- Changes are deliberate: reversing a decision requires a new ADR, forcing reflection.
- The repository reads like an enterprise system with institutional memory.

### Negative / trade-offs
- Small ongoing authoring overhead for the team.

### Follow-ups
- Reference relevant ADRs from architecture docs and PRs.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Decisions in a wiki | Drifts from code; not versioned with the change that implements it. |
| No formal record | Reasoning lost; decisions silently reverted over time. |
