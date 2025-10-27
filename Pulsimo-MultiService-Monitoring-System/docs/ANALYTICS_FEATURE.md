# 📈 Historical Data & Analytics Dashboard

## 🎯 Overview

Transform your monitoring system from **reactive** (seeing only current status) to **proactive** (understanding patterns, trends, and long-term reliability).

---

## ✅ Completed Backend Implementation

### **1. Database Layer**

#### New Tables Created:
```sql
-- Detailed check history (90 days retention)
CREATE TABLE status_history (
    id UUID PRIMARY KEY,
    endpoint_id UUID REFERENCES endpoints(id),
    status VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

-- Aggregated hourly stats (1 year+ retention)
CREATE TABLE status_history_hourly (
    id UUID PRIMARY KEY,
    endpoint_id UUID REFERENCES endpoints(id),
    hour_start TIMESTAMPTZ NOT NULL,
    total_checks INTEGER,
    up_checks INTEGER,
    down_checks INTEGER,
    avg_response_time_ms INTEGER,
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    uptime_percentage NUMERIC(5,2),
    UNIQUE(endpoint_id, hour_start)
);
```

#### Helper Functions:
- ✅ `calculate_uptime()` - Calculate uptime % for any time period
- ✅ `get_downtime_periods()` - Extract downtime windows
- ✅ `cleanup_old_status_history()` - Auto-cleanup after 90 days
- ✅ `aggregate_hourly_statistics()` - Roll up data for long-term storage

---

### **2. Checker Service Updates**

**What Changed:**
- ✅ Every health check now records to `status_history` table
- ✅ Captures: status, response time, status code, error message, timestamp
- ✅ Automatic recording - no configuration needed

**Data Collection:**
```rust
// After each check, record history
sqlx::query(
    "INSERT INTO status_history 
     (endpoint_id, status, response_time_ms, status_code, error_message, checked_at) 
     VALUES ($1, $2, $3, $4, $5, NOW())"
)
```

**Frequency:**
- Default: Every 10 seconds per endpoint
- Configurable per endpoint
- ~8,640 data points per day per service

---

### **3. Analytics API Endpoints**

#### **GET `/api/v1/analytics/uptime/:endpoint_id?period=30d`**

**Returns:**
```json
{
  "endpoint_id": "uuid",
  "endpoint_name": "Production API",
  "period": "30d",
  "uptime_percentage": 99.87,
  "total_checks": 43200,
  "successful_checks": 43144,
  "failed_checks": 56,
  "avg_response_time_ms": 245,
  "min_response_time_ms": 89,
  "max_response_time_ms": 3421,
  "p95_response_time_ms": 567,
  "total_downtime_minutes": 127
}
```

**Use Case:** Dashboard summary cards, SLA tracking

---

#### **GET `/api/v1/analytics/response-times/:endpoint_id?period=7d`**

**Returns:**
```json
[
  {
    "timestamp": "2025-10-27T10:00:00Z",
    "avg_response_time_ms": 234,
    "min_response_time_ms": 145,
    "max_response_time_ms": 892,
    "status": "UP"
  },
  ...
]
```

**Use Case:** Line charts showing response time trends

---

#### **GET `/api/v1/analytics/downtime/:endpoint_id?period=30d`**

**Returns:**
```json
[
  {
    "start_time": "2025-10-27T08:15:00Z",
    "end_time": "2025-10-27T08:27:00Z",
    "duration_minutes": 12,
    "status": "DOWN",
    "ongoing": false
  },
  {
    "start_time": "2025-10-25T14:30:00Z",
    "end_time": null,
    "duration_minutes": 45,
    "status": "DEGRADED",
    "ongoing": true
  }
]
```

**Use Case:** Incident timeline, downtime tracking

---

#### **GET `/api/v1/analytics/timeline/:endpoint_id?period=24h`**

**Returns:**
```json
[
  {
    "timestamp": "2025-10-27T14:32:10Z",
    "event_type": "recovery",
    "status": "UP",
    "details": "DOWN → UP"
  },
  {
    "timestamp": "2025-10-27T14:15:03Z",
    "event_type": "downtime_start",
    "status": "DOWN",
    "details": "UP → DOWN"
  }
]
```

**Use Case:** Visual timeline component, status change history

---

## 🎨 Frontend Components (In Progress)

### **Planned Components:**

#### 1. **Analytics Page** (`/dashboard/analytics`)
Main analytics dashboard with multiple views

#### 2. **UptimeChart Component**
```tsx
<UptimeChart 
  endpointId="uuid"
  period="30d"
  showComparison={true}
/>
```
- Line/area chart showing uptime % over time
- Comparison view (this period vs last period)
- Interactive tooltips

#### 3. **ResponseTimeChart Component**
```tsx
<ResponseTimeChart 
  endpointId="uuid"
  period="7d"
  metrics={["avg", "p95", "max"]}
/>
```
- Multi-series line chart
- Shows avg, min, max, p95 response times
- Zoom/pan capabilities

#### 4. **StatusHeatmap Component**
```tsx
<StatusHeatmap 
  endpointId="uuid"
  period="30d"
/>
```
- Calendar-style heatmap
- Color-coded by uptime %
- Quick visual pattern identification

#### 5. **DowntimeTimeline Component**
```tsx
<DowntimeTimeline 
  endpointId="uuid"
  period="30d"
  maxEvents={50}
/>
```
- Visual timeline of incidents
- Duration bars
- Clickable events for details

#### 6. **SummaryCards Component**
```tsx
<AnalyticsSummaryCards 
  endpointId="uuid"
  period="30d"
/>
```
Cards showing:
- Uptime %
- Avg Response Time
- Total Downtime
- Incident Count
- SLA Status

---

## 📊 Data Visualization Library

**Using: Recharts**
- React charting library
- Declarative API
- Responsive and performant
- Beautiful out-of-the-box styling
- Easy customization

**Installation:**
```bash
npm install recharts
```

**Example Usage:**
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={responseTimeData}>
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="avg_response_time_ms" stroke="#8b5cf6" />
  </LineChart>
</ResponsiveContainer>
```

---

## 🚀 Key Features

### **What Makes This Powerful:**

1. **Time-Series Analysis**
   - View trends over 24h, 7d, 30d, 90d
   - Identify patterns (e.g., "failures every Friday 3pm")
   - Seasonal analysis

2. **SLA Tracking**
   - Calculate actual uptime %
   - Compare against targets (99.9%, 99.99%)
   - Visual SLA compliance indicators

3. **Performance Trends**
   - Response time degradation warnings
   - Capacity planning insights
   - Identify slow periods

4. **Incident Analysis**
   - Full downtime history
   - Duration tracking
   - MTTR (Mean Time To Recovery) calculations

5. **Comparison Views**
   - This week vs last week
   - Month-over-month trends
   - Year-over-year comparisons

---

## 📈 Use Cases

### **For DevOps:**
- **Identify patterns:** "Service crashes every night at 2 AM" → schedule investigation
- **Capacity planning:** Response times increasing → need to scale
- **Post-mortems:** Detailed incident timelines for analysis

### **For Management:**
- **SLA reporting:** "We achieved 99.95% uptime this month"
- **Reliability metrics:** Compare service reliability
- **Executive dashboards:** Visual summaries for stakeholders

### **For Customers:**
- **Public status page:** Show historical uptime
- **Transparency:** Prove reliability with data
- **Incident reports:** Share detailed incident timelines

---

## 🎯 Metrics Tracked

| Metric | Description | Formula |
|--------|-------------|---------|
| **Uptime %** | Percentage of time service was UP | (UP_checks / total_checks) × 100 |
| **Avg Response Time** | Average response across period | AVG(response_time_ms) |
| **P95 Response Time** | 95th percentile (most requests faster) | PERCENTILE_CONT(0.95) |
| **Total Downtime** | Minutes service was unavailable | SUM(downtime_duration) |
| **Incident Count** | Number of distinct outages | COUNT(downtime_periods) |
| **MTTR** | Mean Time To Recovery | AVG(incident_duration) |
| **MTBF** | Mean Time Between Failures | total_time / incident_count |

---

## 🔧 Data Retention Policy

### **Detailed Data (90 days):**
- Every check result stored
- Full granularity
- ~8,640 points/day/endpoint
- Auto-cleanup after 90 days

### **Hourly Aggregates (1 year+):**
- Rolled-up statistics
- Efficient storage
- Long-term trend analysis
- Kept indefinitely

### **Future: Daily Aggregates**
- For multi-year analysis
- Minimal storage footprint
- Historical compliance records

---

## 🎨 UI/UX Design Principles

### **Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard - Production API            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [30d ▼]  [Compare: Previous Period ✓]             │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │Uptime    │ │Avg RT    │ │Downtime  │ │SLA      ││
│  │99.87%    │ │245ms     │ │2h 7m     │ │✓ Pass   ││
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Response Time Trend (7 days)                    ││
│  │ ╱╲                                              ││
│  │╱  ╲  ╱╲                                         ││
│  │    ╲╱  ╲                                        ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Status Heatmap (30 days)                        ││
│  │ [█][█][█][█][░][█][█]...                        ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ Downtime Timeline                               ││
│  │ ●━━━━○  10/27 8:15am - 8:27am (12m)            ││
│  │ ●━○     10/25 2:30pm - 2:35pm (5m)             ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### **Color Scheme:**
- 🟢 UP/Healthy: Green (#10b981)
- 🟡 Degraded: Yellow (#f59e0b)
- 🔴 Down/Error: Red (#ef4444)
- 🔵 Charts: Violet/Purple (#8b5cf6)

---

## 📚 API Client Methods (Frontend)

```typescript
// Get uptime metrics
const metrics = await apiClient.getUptimeMetrics(endpointId, '30d');

// Get response time data for charting
const data = await apiClient.getResponseTimeData(endpointId, '7d');

// Get downtime periods
const downtime = await apiClient.getDowntimePeriods(endpointId, '30d');

// Get timeline events
const timeline = await apiClient.getTimeline(endpointId, '24h');
```

---

## ✅ Implementation Status

- [x] Database schema & migrations
- [x] Checker service data collection
- [x] Analytics API endpoints
- [x] API Gateway routing
- [ ] Frontend API client methods
- [ ] Recharts installation
- [ ] Analytics page component
- [ ] Chart components (Uptime, Response Time, Heatmap, Timeline)
- [ ] Summary cards
- [ ] Period selector
- [ ] Export functionality (PDF/CSV)
- [ ] Testing & QA

---

## 🚀 Next Steps

1. **Complete Frontend (Today)**
   - Install recharts
   - Create analytics page
   - Build chart components
   - Add navigation link

2. **Testing (Today)**
   - Verify all API endpoints
   - Test with real data
   - Check responsive design

3. **Polish (Today)**
   - Loading states
   - Error handling
   - Empty states
   - Tooltips & help text

4. **Future Enhancements**
   - Export reports (PDF)
   - Scheduled email reports
   - Comparison views
   - Custom date ranges
   - Multiple endpoint comparison
   - Alerts on degradation

---

**Status:** 🔨 **Backend Complete - Frontend In Progress**  
**ETA:** Frontend completion within 2-3 hours

This feature will transform your monitoring system into a powerful analytics platform! 🎉
