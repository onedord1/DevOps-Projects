# Configurable Repeat Notification System

## Overview

Pulsimo's Repeat Notification System provides intelligent, configurable alert repetition for services that remain in a DOWN state. This professional-grade feature ensures your team stays informed about ongoing outages without alert fatigue.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Features

### ✅ **Per-Channel Configuration**
- Each notification channel has its own repeat interval
- Configure from 1 minute to 24 hours (1-1440 minutes)
- Default: 15 minutes

### ✅ **Priority-Based Ordering**
- Services are alerted based on criticality:
  1. Database services (highest priority)
  2. Backend/API services
  3. Microservices
  4. Other services

### ✅ **Smart Repeat Logic**
- Tracks last notification time per channel
- Prevents duplicate alerts
- Respects individual channel intervals
- Automatic escalation messaging

### ✅ **Rich Alert Context**
- Downtime duration in human-readable format
- Latest error message from health checks
- Service priority indication
- Escalation markers (⚠️ REPEAT ALERT)

---

## Architecture

```
┌─────────────────┐
│ Checker Service │ ← Runs every 5 minutes
└────────┬────────┘
         │
         ├─ Query DOWN endpoints
         ├─ Fetch notification channels
         ├─ Check per-channel intervals
         └─ Publish events to Redis
              │
              ▼
┌──────────────────────┐
│ Notification Service │
└──────────┬───────────┘
           │
           ├─ Slack
           ├─ Discord
           ├─ Google Chat
           ├─ MS Teams
           ├─ Email
           └─ Webhooks
```

### Components

1. **Checker Service** (`/backend/services/checker`)
   - Runs two async loops:
     - Health check loop (every 10 seconds)
     - Repeat notification loop (every 5 minutes)
   - Queries DOWN endpoints ordered by priority
   - Checks channel-specific repeat intervals
   - Publishes events to Redis Pub/Sub

2. **Notification Service** (`/backend/services/notification`)
   - Subscribes to Redis events
   - Sends notifications to configured channels
   - Tracks notification history in database

3. **API Gateway** (`/backend/services/api-gateway`)
   - CRUD operations for notification channels
   - Validates repeat interval range (1-1440)
   - Stores channel configurations

4. **Frontend** (`/frontend`)
   - Intuitive UI for configuring intervals
   - Preset buttons (2, 5, 15, 30, 60, 120 minutes)
   - Custom input for any value

---

## Configuration

### Database Configuration

The `notification_channels` table includes:

```sql
repeat_interval_minutes INTEGER NOT NULL DEFAULT 15
CHECK (repeat_interval_minutes >= 1 AND repeat_interval_minutes <= 1440)
```

### Environment Variables

No additional environment variables required. The system uses existing database and Redis connections.

### Checker Service Settings

```rust
// Repeat notification check interval
const REPEAT_CHECK_INTERVAL: Duration = Duration::from_secs(300); // 5 minutes
```

---

## How It Works

### Step-by-Step Flow

#### 1. Service Goes DOWN
```
10:00 AM - Service "ProductionDB" changes status to DOWN
         → Initial alert sent to ALL channels immediately
         → Incident created with state: "open"
```

#### 2. Repeat Check Cycle (Every 5 Minutes)
```
10:05 AM - Checker runs repeat notification check
         → Queries all DOWN endpoints
         → For each endpoint:
            - Check each notification channel
            - Calculate time since last notification
            - If elapsed >= channel's repeat_interval_minutes
              → Send repeat alert
```

#### 3. Channel-Specific Intervals
```
Channel Setup:
- Slack: 2 minutes
- Email: 30 minutes
- Discord: 15 minutes

Timeline:
10:00 - Initial alert → Slack, Email, Discord
10:05 - Repeat check → Slack only (5 min >= 2 min) ✅
10:10 - Repeat check → Slack only ✅
10:15 - Repeat check → Slack + Discord ✅
10:20 - Repeat check → Slack only ✅
10:25 - Repeat check → Slack only ✅
10:30 - Repeat check → Slack + Email + Discord ✅
```

#### 4. Priority Ordering
```sql
ORDER BY 
  CASE service_type
    WHEN 'database' THEN 1      -- Highest priority
    WHEN 'backend' THEN 2
    WHEN 'api' THEN 2
    WHEN 'microservice' THEN 3
    ELSE 4                       -- Lowest priority
  END,
  last_status_change_at ASC      -- Oldest outages first
```

#### 5. Escalation Messaging
```
Subject: [STILL DOWN - 2h 45m] ProductionDB

⚠️ REPEAT ALERT: Service has been down for 2h 45m.
Last error: Connection timeout after 5000ms
```

---

## Database Schema

### notification_channels

```sql
CREATE TABLE notification_channels (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  channel_type notification_channel_type NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  repeat_interval_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (repeat_interval_minutes >= 1 AND repeat_interval_minutes <= 1440),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  channel_id UUID REFERENCES notification_channels(id),
  notification_type notification_type NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subject TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## API Endpoints

### List Notification Channels
```http
GET /api/v1/notification-channels
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Slack",
      "channel_type": "slack",
      "repeat_interval_minutes": 5,
      "is_active": true,
      ...
    }
  ]
}
```

### Create Notification Channel
```http
POST /api/v1/notification-channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production Slack",
  "channel_type": "slack",
  "repeat_interval_minutes": 5,
  "config": {
    "webhook_url": "https://hooks.slack.com/..."
  }
}
```

### Update Notification Channel
```http
PUT /api/v1/notification-channels/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production Slack - Updated",
  "channel_type": "slack",
  "repeat_interval_minutes": 2,
  "config": {
    "webhook_url": "https://hooks.slack.com/..."
  }
}
```

### Delete Notification Channel
```http
DELETE /api/v1/notification-channels/{id}
Authorization: Bearer {token}
```

---

## Frontend Integration

### Repeat Interval Selector UI

The frontend provides an intuitive interface for configuring repeat intervals:

```tsx
// Preset buttons for common intervals
const presets = [
  { label: '2 min', value: 2 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
]

// Custom input for any value 1-1440
<Input 
  type="number"
  min={1}
  max={1440}
  value={repeat_interval_minutes}
/>
```

### TypeScript Types

```typescript
interface NotificationChannel {
  id: string
  org_id: string
  name: string
  channel_type: NotificationChannelType
  config: any
  is_active: boolean
  repeat_interval_minutes: number  // NEW FIELD
  created_at: string
  updated_at: string
}
```

---

## Best Practices

### 1. **Tiered Alerting Strategy**
```
Critical Services (Database, Payment):    2-5 minutes
High Priority (API, Backend):             5-15 minutes
Medium Priority (Microservices):          15-30 minutes
Low Priority (Dev/Staging):               60-120 minutes
```

### 2. **Channel-Specific Strategies**
```
PagerDuty/SMS:        2 minutes  (Wake up team immediately)
Slack #incidents:     5 minutes  (Quick team awareness)
Email (management):   30 minutes (Summary updates)
Webhook (SIEM):       15 minutes (Security monitoring)
```

### 3. **Avoid Alert Fatigue**
- Don't set intervals too low (<2 minutes) for non-critical services
- Use different channels for different urgency levels
- Consider business hours (create duplicate channels with different intervals)

### 4. **Testing**
```bash
# Test notification immediately
POST /api/v1/notification-channels/test
{
  "channel_id": "uuid",
  "test_message": "Testing repeat interval configuration"
}
```

---

## Examples

### Example 1: Critical Database Alert

```json
{
  "name": "Production DB Critical",
  "channel_type": "slack",
  "repeat_interval_minutes": 2,
  "config": {
    "webhook_url": "https://hooks.slack.com/services/T00/B00/xxx"
  }
}
```

**Result:** Alert every 2 minutes for database outages

---

### Example 2: Multi-Channel Setup

```json
[
  {
    "name": "Slack - Immediate",
    "channel_type": "slack",
    "repeat_interval_minutes": 5
  },
  {
    "name": "Email - Summary",
    "channel_type": "email",
    "repeat_interval_minutes": 60
  },
  {
    "name": "Discord - Team",
    "channel_type": "discord",
    "repeat_interval_minutes": 15
  }
]
```

**Result:**
- Slack: Alert every 5 minutes
- Email: Summary every hour
- Discord: Team updates every 15 minutes

---

### Example 3: Business Hours Configuration

Create two channels for the same destination with different intervals:

```json
[
  {
    "name": "Slack - Business Hours",
    "channel_type": "slack",
    "repeat_interval_minutes": 5,
    "config": { "webhook_url": "..." }
  },
  {
    "name": "Slack - After Hours",
    "channel_type": "slack",
    "repeat_interval_minutes": 30,
    "config": { "webhook_url": "..." }
  }
]
```

Then manually enable/disable based on time (or extend system for scheduled channels).

---

## Troubleshooting

### Issue: Notifications not repeating

**Check:**
1. ✅ Is the service still DOWN?
   ```sql
   SELECT name, status, last_status_change_at 
   FROM endpoints 
   WHERE status = 'DOWN';
   ```

2. ✅ Is the channel active?
   ```sql
   SELECT name, is_active, repeat_interval_minutes 
   FROM notification_channels;
   ```

3. ✅ Check checker service logs:
   ```bash
   docker-compose logs checker --tail 50
   ```

4. ✅ Has enough time passed?
   - Checker runs every 5 minutes
   - If interval is 2 minutes, notification will still only check every 5 minutes
   - It will send if `elapsed >= interval`

### Issue: Too many notifications

**Solution:**
- Increase `repeat_interval_minutes`
- Check for duplicate channels
- Verify incidents are being created (prevents re-sending initial alerts)

---

## Performance Considerations

### Database Queries
- Repeat check query is optimized with indexes
- Limited to 50 DOWN endpoints per cycle
- Uses EXISTS subqueries for efficiency

### Memory Usage
- Channels loaded once per cycle
- Lightweight notification tracking
- Redis Pub/Sub for event distribution

### Scalability
- System handles thousands of channels
- Per-org channel filtering
- Async processing with Tokio

---

## Future Enhancements

### Planned Features
- [ ] Escalation policies (increase frequency over time)
- [ ] Scheduled intervals (different rates for business hours)
- [ ] Smart throttling (reduce frequency after X alerts)
- [ ] Channel groups (apply same interval to multiple channels)
- [ ] Notification templates with custom repeat messages

### Configuration Options
- [ ] Per-endpoint repeat interval overrides
- [ ] Silence periods (no repeats during maintenance)
- [ ] Alert acknowledgment (stop repeats when acknowledged)

---

## Support

For questions or issues:
1. Check the logs: `docker-compose logs checker notification`
2. Review database state: `SELECT * FROM notification_channels;`
3. Test individual channels: `POST /api/v1/notification-channels/test`

---

## License

Part of Pulsimo Service Monitoring System
© 2025 All Rights Reserved
