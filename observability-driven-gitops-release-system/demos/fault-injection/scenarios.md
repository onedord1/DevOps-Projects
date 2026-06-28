# Fault Injection Scenarios

These scenarios drive the progressive-delivery loop into observable failure modes, demonstrating the platform's automatic rollback capability. Each scenario uses the `FAIL_RATE` / `LATENCY_MS` knobs built into the Phase 3 services (via `pkg/faults`).

## Scenario 1 — Payment provider failure (payment SLO breach → rollback)

**What:** ship a payment image where every call to the upstream provider fails.  
**Expected:** the `payment-success` AnalysisTemplate fails at the 5% canary step; the rollout aborts and restores the stable version. An incident is opened in the incident service and a "Rollback" annotation appears in Grafana.

```bash
# 1. Generate background traffic
bash rollouts/demo.sh load &
LOAD_PID=$!

# 2. Deploy the bad payment image (FAIL_RATE=1 is baked into the demo tag)
bash rollouts/demo.sh bad-payment

# 3. Watch — should abort automatically within 2-3 analysis intervals (~3 min)
bash rollouts/demo.sh status payment

# 4. Verify the incident was opened
curl -s http://localhost:8090/incidents | python3 -m json.tool | grep -A5 '"service": "payment"'

# 5. Check Grafana for the rollback annotation
# Dashboards → Acme Platform — Service Overview → annotations list

# Cleanup
kill $LOAD_PID 2>/dev/null; true
```

## Scenario 2 — High latency (P95 SLO breach → rollback)

**What:** ship a frontend version that adds 700ms to every response (over the 500ms P95 threshold).

```bash
# 1. Background traffic
bash rollouts/demo.sh load &
LOAD_PID=$!

# 2. Patch LATENCY_MS on the frontend Rollout to trigger a new revision
kubectl -n acme patch rollout frontend --type=json \
  -p '[{"op":"add","path":"/spec/template/spec/containers/0/env/-","value":{"name":"LATENCY_MS","value":"700"}}]'

# 3. Watch — p95-latency analysis should fail at 5% step
bash rollouts/demo.sh status frontend

# 4. Restore
kubectl -n acme patch rollout frontend --type=json \
  -p '[{"op":"remove","path":"/spec/template/spec/containers/0/env/1"}]'

kill $LOAD_PID 2>/dev/null; true
```

## Scenario 3 — Container crash-loop (restart-count guardrail → rollback)

**What:** deploy an image that crashes immediately on startup (simulated via a bad env var).

```bash
# Set an unresolvable NATS_URL that makes the order service crash on init
kubectl -n acme patch rollout order --type=json \
  -p '[{"op":"replace","path":"/spec/template/spec/containers/0/env/3/value","value":"nats://bad-host:4222"}]'

# restart-count AnalysisTemplate detects restarts and aborts
bash rollouts/demo.sh status order

# Restore
kubectl -n acme patch rollout order --type=json \
  -p '[{"op":"replace","path":"/spec/template/spec/containers/0/env/3/value","value":"nats://nats:4222"}]'
```

## Scenario 4 — Happy path (healthy canary promotes end to end)

**What:** ship a new image version that passes all SLO checks and reaches 100%.

```bash
# 1. Build and push a v2 image (identical to v1, so all SLOs pass)
TAG=v2 PUSH=1 make build-apps

# 2. Background traffic
bash rollouts/demo.sh load &
LOAD_PID=$!

# 3. Promote
bash rollouts/demo.sh promote frontend v2

# 4. Watch each step: 5% → analysis pass → 20% → analysis pass → … → 100%
bash rollouts/demo.sh status frontend

# 5. Grafana shows a "Deploy" annotation at the time of promotion

kill $LOAD_PID 2>/dev/null; true
```

## Expected Grafana observations

For all fault scenarios, the "Acme Platform — Service Overview" dashboard shows:

- The canary-specific metric (`rollouts_pod_template_hash`-filtered) diverges from the stable line.
- An alert fires on the SLO panel within ~5 minutes.
- A **Rollback annotation** marks the exact time of abort.
- The success-ratio / P95 panel returns to the stable baseline immediately after rollback.
