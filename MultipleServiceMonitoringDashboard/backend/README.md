## 🧩 Service Dependencies

This describes the flow of communication, primarily through REST API calls and events.

### 1. The Frontend (Your React App) → **API Gateway**
*   **How**: REST API over HTTP.
*   **Why**: The API Gateway is the single entry point. It handles authentication, rate limiting, and routes requests to the correct backend service.

### 2. **API Gateway** → All Other Services
*   **How**: REST API over HTTP.
*   **Why**: The Gateway acts as a reverse proxy. When a request comes in for `/api/v1/monitors`, it forwards it to the Configuration Service. A request for `/api/v1/alert-rules` goes to the Alerting Service, and so on.

### 3. **Configuration Service** → **HealthCheck Service**
*   **How**: **Event Bus (NATS)**.
*   **Why**: When you create, update, or delete a monitor in the Configuration Service, it publishes a `config.changed` event. The HealthCheck Service subscribes to these events to update its internal schedule (start probing a new monitor, stop probing a deleted one). This is a **decoupled, asynchronous** dependency.

### 4. **HealthCheck Service** → **Metrics Service**
*   **How**: **Event Bus (NATS)**.
*   **Why**: After the HealthCheck Service performs a probe (e.g., checks if Google is up), it publishes a `probe.result` event containing the result (latency, success/failure). The Metrics Service subscribes to these events to store the time-series data. This is also **decoupled**.

### 5. **Metrics Service** → **Alerting Service**
*   **How**: **Event Bus (NATS)**.
*   **Why**: The Alerting Service also subscribes to the `probe.result` events published by the HealthCheck Service. It uses the incoming results to evaluate its alert rules (e.g., "is latency > 500ms?"). This is a **fan-out** pattern where one event (`probe.result`) is consumed by multiple services (Metrics and Alerting).

### 6. **Alerting Service** → **Notification Service** & **Incident Service**
*   **How**: **Event Bus (NATS)**.
*   **Why**:
    *   When the Alerting Service triggers a new alert, it publishes an `alert.triggered` event.
    *   The **Notification Service** subscribes to `alert.triggered` and `alert.resolved` events to send notifications (Slack, email, etc.).
    *   The **Incident Service** also subscribes to `alert.triggered` events to create incidents for critical alerts.

### 7. **Auth Service** → **API Gateway**
*   **How**: REST API over HTTP.
*   **Why**: When a user tries to log in via the Gateway, the Gateway makes a direct HTTP call to the Auth Service to validate the credentials and get a JWT.

---

### Visual Dependency Graph

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend   │─────►│   API Gateway    │─────►│  Auth Service   │
└──────────────┘      └────────┬─────────┘      └─────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Config Svc  │ │ Alerting Svc │ │ Incident Svc │
        └──────┬──────┘ └──────┬───────┘ └──────────────┘
               │                 │
               │ (Event)         │ (Event)
               ▼                 ▼
        ┌──────────────┐   ┌──────────────┐
        │ HealthCheck  │   │ Notification │
        │   Service    │   │   Service    │
        └──────┬───────┘   └──────────────┘
               │ (Event)
               ▼
        ┌──────────────┐
        │ Metrics Svc  │
        └──────────────┘
```

---

## 🗄️ Database Ownership

This is simpler. Each service owns its own data, but they all share the same physical PostgreSQL database cluster.

*   **PostgreSQL (with TimescaleDB extension)**:
    *   **Auth Service**: Uses the `users` table.
    *   **Configuration Service**: Uses the `monitors` table.
    *   **Metrics Service**: Uses the `metrics` and `metrics_agg` hypertables.
    *   **Alerting Service**: Uses the `alert_rules` and `alert_instances` tables.
    *   **Notification Service**: Uses the `notification_channels`, `notification_templates`, and `notification_records` tables.
    *   **Incident Service**: Uses the `incidents`, `incident_events`, `incident_comments`, and `postmortems` tables.

*   **Redis**:
    *   **Alerting Service**: Uses it for alert cooldowns (`alert:cooldown:<rule_id>`).
    *   **API Gateway**: Uses it for rate-limiting counters and caching JWT blacklists.
    *   **Auth Service**: Could use it for caching session tokens.

*   **NATS (Event Bus)**:
    *   **No service owns the data**, but many services **depend on it** for communication. The HealthCheck, Metrics, Alerting, Notification, and Incident services are the primary consumers and producers.

---