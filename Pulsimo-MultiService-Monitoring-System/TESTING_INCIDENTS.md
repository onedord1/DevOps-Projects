# 🧪 Testing Phase 1: Incident Management

## Quick Test Guide

### ✅ Prerequisites
- All services running
- Database migrated
- At least one endpoint configured

---

## 🎯 Test Scenario 1: View Incidents Page

### Steps:
1. Navigate to: `http://192.168.10.69:3000/incidents`
2. Check that page loads with:
   - Stats cards (4 cards showing zeros initially)
   - Filter section
   - Empty state message

### Expected Result:
```
✅ Page loads without errors
✅ Stats show: 0 open, 0 critical, 0 investigating, 0 resolved today
✅ Filters display correctly
✅ "No incidents found" message shows
```

---

## 🎯 Test Scenario 2: Auto-Create Incident on Failure

### Steps:
1. Add a database service with WRONG credentials:
   ```
   Service Name: Test Failure
   Service Type: Database (PostgreSQL/MySQL)
   Database Type: PostgreSQL
   URL: postgresql://postgres:5432
   Username: monitoring
   Password: wrong_password
   Database Name: monitoring_system
   ```

2. Wait 3-5 minutes for:
   - Health check to fail
   - Status to change to DOWN
   - Incident to be created

3. Check incidents page

### Expected Result:
```
✅ Service status shows "DOWN" (red)
✅ New incident appears with:
   - Title: "Test Failure is Down"
   - Severity: CRITICAL (red badge)
   - State: OPEN (red)
   - Failure count: increases over time
   - Description contains error message
```

### Verify in Database:
```bash
docker exec monitoring-postgres psql -U monitoring -d monitoring_system -c \
  "SELECT id, title, severity, state, failure_count FROM incidents ORDER BY created_at DESC LIMIT 1;"
```

Should show:
```
              id              |        title         | severity | state | failure_count
------------------------------+---------------------+----------+-------+--------------
 <uuid>                       | Test Failure is Down | critical | open  |      5
```

---

## 🎯 Test Scenario 3: Auto-Resolve on Recovery

### Steps:
1. Fix the database service credentials:
   - Go to dashboard
   - Click edit on "Test Failure"
   - Change password to correct one: `monitoring_password`
   - Save

2. Wait 1-2 minutes for:
   - Health check to succeed
   - Status to change to UP  
   - Incident to auto-resolve

3. Check incidents page

### Expected Result:
```
✅ Service status shows "UP" (green)
✅ Incident updated:
   - State: RESOLVED (green badge)
   - Resolved timestamp shown
   - Resolution notes: "Auto-resolved: Service recovered..."
```

### Verify in Database:
```bash
docker exec monitoring-postgres psql -U monitoring -d monitoring_system -c \
  "SELECT state, resolved_at, resolution_notes FROM incidents WHERE title LIKE 'Test Failure%';"
```

Should show:
```
  state   |         resolved_at        |                   resolution_notes                    
----------+---------------------------+--------------------------------------------------------
 resolved | 2025-10-25 15:30:45+00    | Auto-resolved: Service recovered and is now healthy
```

---

## 🎯 Test Scenario 4: Statistics Update

### After incidents are created/resolved:

1. Check stats on incidents page
2. Should see:
   ```
   Open: 0 (after resolution)
   Critical: 0 (after resolution)
   Investigating: 0
   Resolved Today: 1 ✅
   ```

### API Test:
```bash
curl -H "Authorization: Bearer <your_token>" \
  http://192.168.10.69:8080/api/v1/incidents/stats | jq
```

Expected:
```json
{
  "success": true,
  "data": {
    "total_incidents": 1,
    "open_incidents": 0,
    "acknowledged_incidents": 0,
    "investigating_incidents": 0,
    "resolved_today": 1,
    "critical_incidents": 0,
    "avg_resolution_time_minutes": 5.5
  }
}
```

---

## 🎯 Test Scenario 5: Filtering

### Steps:
1. Create multiple test incidents (by adding services with bad URLs)
2. Go to incidents page
3. Test filters:
   - State: Select "Open" → Should show only open
   - Severity: Select "Critical" → Should show only critical
   - Search: Type service name → Should filter by text
   - Clear Filters → Should show all

### Expected Result:
```
✅ Filters work correctly
✅ Results update immediately
✅ Pagination appears if > 20 incidents
✅ Clear filters resets all
```

---

## 🎯 Test Scenario 6: Pagination

### Steps:
1. Create 25+ incidents
2. Check incidents page
3. Navigate through pages

### Expected Result:
```
✅ Shows 20 incidents per page
✅ Page navigation appears
✅ "Previous" disabled on page 1
✅ "Next" disabled on last page
✅ Page number displays correctly
```

---

## 🎯 Test Scenario 7: State History

### API Test:
```bash
# Get incident ID
INCIDENT_ID=$(docker exec monitoring-postgres psql -U monitoring -d monitoring_system -t -c \
  "SELECT id FROM incidents LIMIT 1;")

# Get state history
curl -H "Authorization: Bearer <your_token>" \
  http://192.168.10.69:8080/api/v1/incidents/$INCIDENT_ID/history | jq
```

Expected:
```json
{
  "success": true,
  "data": [
    {
      "id": "<uuid>",
      "incident_id": "<incident_id>",
      "from_state": null,
      "to_state": "open",
      "changed_by": "system",
      "notes": "Incident auto-created by monitoring system",
      "changed_at": "2025-10-25T15:25:00Z"
    },
    {
      "id": "<uuid>",
      "incident_id": "<incident_id>",
      "from_state": "open",
      "to_state": "resolved",
      "changed_by": "system",
      "notes": "Auto-resolved by monitoring system",
      "changed_at": "2025-10-25T15:30:00Z"
    }
  ]
}
```

---

## 🔍 Debugging

### Check Checker Logs:
```bash
docker logs monitoring-checker --tail 50
```

Look for:
```
Created incident <id> for endpoint <name> (<endpoint_id>)
Auto-resolved incident <id> for endpoint <name> (<endpoint_id>)
```

### Check Database:
```bash
docker exec monitoring-postgres psql -U monitoring -d monitoring_system
```

```sql
-- List all incidents
SELECT id, title, severity, state, created_at FROM incidents ORDER BY created_at DESC LIMIT 10;

-- Check state history
SELECT * FROM incident_state_history ORDER BY changed_at DESC LIMIT 10;

-- Count incidents by state
SELECT state, COUNT(*) FROM incidents GROUP BY state;
```

### Check API Gateway Logs:
```bash
docker logs monitoring-api-gateway --tail 50
```

---

## ✅ Success Criteria

Phase 1 is successful if:

- [  ] Incidents page loads without errors
- [  ] Stats display correctly
- [  ] Filters work
- [  ] Auto-creates incident when service fails
- [  ] Auto-resolves incident when service recovers
- [  ] State history is recorded
- [  ] Statistics update in real-time
- [  ] UI is responsive and polished
- [  ] No duplicate incidents created
- [  ] MTTR calculated correctly

---

## 🐛 Common Issues

### Issue: Incidents not auto-creating
**Solution**: 
- Check checker logs for errors
- Verify endpoint failure threshold is reached
- Ensure database migration ran successfully

### Issue: Page not loading
**Solution**:
- Check frontend build succeeded
- Verify API endpoints are accessible
- Check browser console for errors

### Issue: Stats showing zeros
**Solution**:
- Create at least one incident
- Wait for checker to run (30-60 seconds)
- Refresh page

---

## 📊 Performance Benchmarks

Expected performance:
- Incident creation: < 100ms
- API list response: < 200ms (20 items)
- Page load time: < 1s
- Auto-creation lag: 30-90 seconds after failure
- Auto-resolution lag: 30-90 seconds after recovery

---

## 🎉 Next Steps After Testing

Once Phase 1 testing passes:
1. Add incident detail modal
2. Add dashboard widget
3. Implement manual state changes in UI
4. Add assignment functionality
5. Move to Phase 2 features

---

**Happy Testing! 🚀**
