# Notification Silencing System

## Overview

Pulsimo's Notification Silencing System provides granular control over alert suppression, allowing administrators to temporarily or permanently mute notifications for specific services and channels. This professional-grade feature prevents alert fatigue during maintenance windows, known issues, or when specific services need to be quietly monitored.

---

## Table of Contents

- [Features](#features)
- [User Interface](#user-interface)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Features

### ✅ **Granular Control**
- **Per-Endpoint Silencing**: Mute notifications for specific services
- **Per-Channel Silencing**: Silence specific notification channels (Slack, Discord, etc.)
- **Global Silencing**: Silence all channels for an endpoint

### ✅ **Flexible Duration Options**
- **Temporary Silences**: Auto-expire after specified duration (1 min - 30 days)
- **Permanent Silences**: Remain active until manually unmuted
- **Preset Durations**: Quick selection (1h, 4h, 12h, 24h, 3 days, 1 week)
- **Custom Durations**: Specify any duration in minutes

### ✅ **Professional UI/UX**
- **Beautiful Dialog**: Polished, modern interface with gradients and animations
- **Visual Indicators**: Bell icon with status indicator on each service card
- **Rich Toast Notifications**: Elegant confirmation messages with duration display
- **Responsive Design**: Works seamlessly on all screen sizes

### ✅ **Smart Management**
- **Automatic Expiration**: Temporary silences auto-deactivate when expired
- **Audit Trail**: Track who created silences and why
- **Reason Logging**: Optional reason field for documentation
- **Conflict Resolution**: New silences replace existing ones for same endpoint+channel

---

## User Interface

### Service Card Bell Icon

Each service endpoint card features a bell icon in the action button row:

```
┌────────────────────────────────────┐
│  🟢 Production API        [ONLINE] │
│  https://api.example.com           │
│                                    │
│  🔔 ✏️ 🗑️ 🔗  ← Action buttons    │
│  ↑                                 │
│  Bell icon (click to silence)      │
└────────────────────────────────────┘
```

**States:**
- **🔔 Normal Bell**: No active silences
- **🔕 Muted Bell (Violet)**: Active silence with indicator dot

### Silence Dialog

**Layout:**
```
┌─────────────────────────────────────────────┐
│  🔔 Silence Notifications                   │
│  ────────────────────────────────────────   │
│                                             │
│  📢 Which notification channels?            │
│  ○ All Channels 🔊                          │
│  ○ Slack - Production                       │
│  ○ Discord - Team Alerts                    │
│  ○ Email - Management                       │
│                                             │
│  ⏰ How long?                                │
│  ● Temporary ⏱️                             │
│  ○ Permanent ♾️                             │
│                                             │
│  Select Duration                            │
│  [1 hour] [4 hours] [12 hours]             │
│  [24 hours] [3 days] [1 week]              │
│                                             │
│  Custom (minutes): [___60___]              │
│                                             │
│  📝 Reason (optional)                       │
│  [Planned maintenance window...]            │
│  0/500 characters                           │
│                                             │
│  [Cancel] [🔕 Silence Notifications]        │
└─────────────────────────────────────────────┘
```

### Success Toast

```
┌──────────────────────────────────────────┐
│  🔕 Notifications Silenced               │
│  ──────────────────────────────────────  │
│  [Production API] on [all channels]      │
│  ⏰ Will resume after 1 hour             │
└──────────────────────────────────────────┘
```

---

## Architecture

### Component Flow

```
┌─────────────┐
│   User      │
│   Clicks    │
│   Bell 🔔   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ SilenceDialog   │
│ Component       │
│  - Select       │
│    channel      │
│  - Choose       │
│    duration     │
│  - Add reason   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  API Client     │
│  POST /silences │
└──────┬──────────┘
       │
       ▼
┌────────────────────┐
│  API Gateway       │
│  create_silence()  │
│  - Validate        │
│  - Deactivate old  │
│  - Create new      │
└──────┬─────────────┘
       │
       ▼
┌─────────────────────────┐
│  PostgreSQL             │
│  notification_silences  │
└─────────────────────────┘

When notification triggered:
┌─────────────────┐
│ Notification    │
│ Service         │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Check if       │
│  silenced?      │
└──────┬──────────┘
       │
       ├─ YES → Skip notification
       │
       └─ NO → Send notification
```

---

## Database Schema

### notification_silences Table

```sql
CREATE TABLE notification_silences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE CASCADE,
    -- NULL channel_id means silence applies to ALL channels
    
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    
    silence_type VARCHAR(20) NOT NULL CHECK (silence_type IN ('temporary', 'permanent')),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent silences
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_silences_endpoint_id ON notification_silences(endpoint_id);
CREATE INDEX idx_silences_channel_id ON notification_silences(channel_id);
CREATE INDEX idx_silences_org_id ON notification_silences(org_id);
CREATE INDEX idx_silences_active_expires ON notification_silences(is_active, expires_at) 
    WHERE is_active = true;
CREATE INDEX idx_silences_endpoint_channel_active 
    ON notification_silences(endpoint_id, channel_id, is_active)
    WHERE is_active = true;
```

**Automatic Cleanup:**
```sql
CREATE OR REPLACE FUNCTION deactivate_expired_silences()
RETURNS void AS $$
BEGIN
    UPDATE notification_silences
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
      AND silence_type = 'temporary'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## API Reference

### Create Silence

```http
POST /api/v1/silences
Authorization: Bearer {token}
Content-Type: application/json

{
  "endpoint_id": "uuid",
  "channel_id": "uuid",  // null for all channels
  "silence_type": "temporary",
  "duration_minutes": 60,
  "reason": "Planned maintenance"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "endpoint_id": "uuid",
    "channel_id": "uuid",
    "silence_type": "temporary",
    "expires_at": "2025-10-27T21:15:00Z",
    ...
  }
}
```

### Unmute Endpoint

```http
POST /api/v1/silences/unmute
Authorization: Bearer {token}
Content-Type: application/json

{
  "endpoint_id": "uuid",
  "channel_id": "uuid"  // null to unmute all channels
}

Response:
{
  "success": true,
  "data": null
}
```

### List Active Silences

```http
GET /api/v1/silences
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "endpoint_id": "uuid",
      "endpoint_name": "Production API",
      "channel_id": "uuid",
      "channel_name": "Slack - Production",
      "created_by_name": "John Doe",
      "reason": "Planned maintenance",
      "silence_type": "temporary",
      "expires_at": "2025-10-27T21:15:00Z",
      ...
    }
  ]
}
```

### Check if Silenced

```http
GET /api/v1/silences/check?endpoint_id={uuid}&channel_id={uuid}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "is_silenced": true,
    "silence_id": "uuid",
    "expires_at": "2025-10-27T21:15:00Z",
    "reason": "Planned maintenance"
  }
}
```

### Get Endpoint Silence Status

```http
GET /api/v1/silences/endpoint/{endpoint_id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channel_id": null,  // Global silence
      "silence_type": "temporary",
      "expires_at": "2025-10-27T21:15:00Z",
      ...
    }
  ]
}
```

### Get Duration Presets

```http
GET /api/v1/silences/presets

Response:
{
  "success": true,
  "data": [
    { "label": "1 hour", "minutes": 60 },
    { "label": "4 hours", "minutes": 240 },
    { "label": "12 hours", "minutes": 720 },
    { "label": "24 hours", "minutes": 1440 },
    { "label": "3 days", "minutes": 4320 },
    { "label": "1 week", "minutes": 10080 }
  ]
}
```

---

## Usage Examples

### Example 1: Silence During Maintenance Window

**Scenario:** Database maintenance from 2 AM to 6 AM

```javascript
// Silence for 4 hours
const response = await apiClient.createSilence({
  endpoint_id: "db-production-uuid",
  channel_id: null,  // All channels
  silence_type: "temporary",
  duration_minutes: 240,
  reason: "Scheduled database maintenance window"
});
```

### Example 2: Silence Specific Channel Only

**Scenario:** Testing Slack integration, don't want spam

```javascript
// Silence only Slack channel for 1 hour
const response = await apiClient.createSilence({
  endpoint_id: "test-api-uuid",
  channel_id: "slack-channel-uuid",
  silence_type: "temporary",
  duration_minutes: 60,
  reason: "Testing Slack webhook configuration"
});
```

### Example 3: Permanent Silence (Known Issue)

**Scenario:** Legacy system with known issues, monitoring for other reasons

```javascript
// Silence permanently until manually unmuted
const response = await apiClient.createSilence({
  endpoint_id: "legacy-system-uuid",
  channel_id: null,
  silence_type: "permanent",
  reason: "Legacy system - known issue, tracking uptime only"
});
```

### Example 4: Unmute Before Schedule

**Scenario:** Maintenance completed early

```javascript
// Remove silence
await apiClient.unmuteEndpoint("db-production-uuid");
```

---

## Best Practices

### 1. **Use Appropriate Durations**
```
Planned maintenance:  Match exact window + buffer
Testing/Debugging:    1-4 hours
Known issues:         Permanent (document reason)
Weekend deployments:  48-72 hours
```

### 2. **Document Reasons**
```
✅ GOOD:
- "Database migration 2-6 AM PST"
- "Testing new SSL certificate"
- "Known memory leak, fix scheduled for v2.1"

❌ BAD:
- "maintenance"
- "testing"
- ""
```

### 3. **Channel-Specific Strategies**
```
PagerDuty:   Silence during non-critical deployments
Slack:       Keep active for team awareness
Email:       Silence for known issues
Webhooks:    Silence for testing integrations
```

### 4. **Unmute Proactively**
```
- Set calendar reminders
- Unmute when task completes
- Use temporary silences when possible
- Review active silences weekly
```

### 5. **Team Communication**
```
- Announce silences in team chat
- Update incident tracker
- Add to maintenance calendar
- Set unmute reminders
```

---

## Troubleshooting

### Problem: Notifications Still Sending

**Check:**
1. Is silence active?
   ```sql
   SELECT * FROM notification_silences 
   WHERE endpoint_id = '...' AND is_active = true;
   ```

2. Has it expired?
   ```sql
   SELECT * FROM notification_silences 
   WHERE expires_at < NOW() AND is_active = true;
   ```

3. Correct channel?
   - Global silence (channel_id = NULL) affects all channels
   - Specific silence only affects that channel

4. Run cleanup:
   ```sql
   SELECT deactivate_expired_silences();
   ```

### Problem: Can't Create Silence

**Check:**
1. **Permissions**: Must be authenticated user
2. **Endpoint exists**: Verify endpoint_id is valid
3. **Channel exists**: If channel_id specified, must be valid
4. **Duration range**: 1-43200 minutes (1 min - 30 days)

### Problem: Silence Not Visible in UI

**Check:**
1. Refresh the page
2. Check browser console for errors
3. Verify API response
4. Check if silence is actually active in database

---

## Performance Considerations

### Query Optimization
- Compound indexes on `(endpoint_id, channel_id, is_active)`
- Automatic cleanup runs on notification check
- Efficient EXISTS queries for silence checks

### Scalability
- O(1) lookup for silence check (indexed)
- Minimal overhead per notification
- Background cleanup via trigger

### Monitoring
```sql
-- Active silences count
SELECT COUNT(*) FROM notification_silences WHERE is_active = true;

-- Expired but not cleaned up
SELECT COUNT(*) FROM notification_silences 
WHERE is_active = true 
AND expires_at < NOW();

-- Per-endpoint silence count
SELECT endpoint_id, COUNT(*) 
FROM notification_silences 
WHERE is_active = true 
GROUP BY endpoint_id;
```

---

## Security Considerations

### Access Control
- Only authenticated users can create silences
- Silences are org-scoped
- Audit trail via `created_by` field

### Validation
- Duration limits (1-43200 minutes)
- Reason length limit (500 characters)
- Endpoint/channel existence checks

### Audit Trail
```sql
-- Who silenced what and when
SELECT 
    e.name as endpoint,
    nc.name as channel,
    u.name as user,
    ns.reason,
    ns.silence_type,
    ns.created_at,
    ns.expires_at
FROM notification_silences ns
JOIN endpoints e ON ns.endpoint_id = e.id
LEFT JOIN notification_channels nc ON ns.channel_id = nc.id
JOIN users u ON ns.created_by = u.id
WHERE ns.org_id = '...'
ORDER BY ns.created_at DESC;
```

---

## Future Enhancements

### Planned Features
- [ ] Scheduled silences (future start time)
- [ ] Recurring silences (e.g., every weekend)
- [ ] Silence templates/presets
- [ ] Bulk silence operations
- [ ] Silence inheritance (project-level)
- [ ] Notification when silence expires
- [ ] Silence approval workflow
- [ ] Integration with calendar systems

---

## Support

For questions or issues:
1. Check silence status: `GET /api/v1/silences/endpoint/{id}`
2. Review database: `SELECT * FROM notification_silences WHERE is_active = true`
3. Check logs: `docker-compose logs notification api-gateway`

---

## License

Part of Pulsimo Service Monitoring System
© 2025 All Rights Reserved
