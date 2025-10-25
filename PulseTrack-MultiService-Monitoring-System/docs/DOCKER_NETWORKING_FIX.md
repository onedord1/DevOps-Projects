# Docker Networking Issue - Connection Refused Fix

## 🔴 Critical Issue Discovered

**Error**: `PostgreSQL connection failed: error communicating with database: Connection refused (os error 111)`

**Root Cause**: Using `localhost` in database URLs from inside Docker containers

---

## 🧐 Why `localhost` Doesn't Work in Docker

### The Problem

When you add a database service with URL `postgresql://localhost:5432`, the checker service (running inside a Docker container) tries to connect to `localhost`, which refers to **itself** (the container), not the host machine or other containers.

```
┌─────────────────────────────────────────┐
│  Your Computer (Host Machine)           │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Docker Container: monitoring-checker│ │
│  │                                     │ │
│  │  Tries: postgresql://localhost:5432│ │
│  │  Looks for: Database inside THIS    │ │
│  │             container (doesn't exist)│ │
│  │  ❌ Connection Refused!              │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Docker Container: monitoring-postgres│ │
│  │  📦 PostgreSQL running on port 5432 │ │
│  │  (Different container!)             │ │
│  └────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

---

## ✅ Solutions

### Solution 1: Use Docker Service Names (Recommended)

In Docker Compose, containers can reach each other using **service names** as hostnames.

**Your docker-compose.yml services**:
```yaml
services:
  postgres:      ← This is the hostname!
  redis:         ← This is the hostname!
  api-gateway:   ← This is the hostname!
```

**Correct URL Format**:
```
❌ Wrong:  postgresql://localhost:5432
✅ Right:  postgresql://postgres:5432

❌ Wrong:  mysql://localhost:3306
✅ Right:  mysql://mysql:3306
```

**Example**:
```
Service Name: Monitoring Database
URL: postgresql://postgres:5432
Username: monitoring
Password: monitoring_password
Database Name: monitoring_system
```

---

### Solution 2: Use Host Machine's IP (For External Databases)

If you're monitoring a database on your host machine or another server, use the actual IP address.

**For Docker to Host**:
```
# Use special Docker hostname
URL: postgresql://host.docker.internal:5432

# Or use your machine's IP
URL: postgresql://192.168.10.69:5432
```

**For Remote Servers**:
```
URL: postgresql://188.166.196.124:15434
```

---

## 📋 URL Patterns Reference

### Local Docker Services

| Service Type | Wrong ❌ | Correct ✅ |
|-------------|----------|------------|
| PostgreSQL (Docker) | `postgresql://localhost:5432` | `postgresql://postgres:5432` |
| MySQL (Docker) | `mysql://localhost:3306` | `mysql://mysql:3306` |
| Redis (Docker) | `redis://localhost:6379` | `redis://redis:6379` |
| API Gateway (Docker) | `http://localhost:8080` | `http://api-gateway:8080` |

### Host Machine Databases

| Service Type | Option 1 | Option 2 |
|-------------|----------|----------|
| PostgreSQL (Host) | `postgresql://host.docker.internal:5432` | `postgresql://192.168.10.69:5432` |
| MySQL (Host) | `mysql://host.docker.internal:3306` | `mysql://192.168.10.69:3306` |

### Remote/External Databases

| Service Type | Format |
|-------------|--------|
| PostgreSQL (Remote) | `postgresql://[IP_OR_DOMAIN]:[PORT]` |
| MySQL (Remote) | `mysql://[IP_OR_DOMAIN]:[PORT]` |

---

## 🔧 How to Fix Your Existing Services

### Step 1: Check Current Services

```bash
# See which services are using localhost
docker exec monitoring-postgres psql -U monitoring -d monitoring_system -c \
  "SELECT name, url FROM endpoints WHERE url LIKE '%localhost%';"
```

### Step 2: Update URLs

**For Monitoring System's Own Database**:
```sql
UPDATE endpoints 
SET url = 'postgresql://postgres:5432' 
WHERE url LIKE '%postgresql://localhost:5432%';
```

**For Monitoring System's Own Services**:
```sql
UPDATE endpoints 
SET url = 'http://api-gateway:8080' 
WHERE url LIKE '%http://localhost:8080%';
```

### Step 3: Test From Checker Container

```bash
# Test PostgreSQL connection from inside checker
docker exec monitoring-checker sh -c \
  "apk add --no-cache postgresql-client && \
   psql postgresql://monitoring:monitoring_password@postgres:5432/monitoring_system -c 'SELECT 1;'"
```

If this works, your health checks will work!

---

## 🎯 Complete Examples

### Example 1: Monitor Monitoring System's Own Database

```yaml
Service Name: Self - PostgreSQL Database
Service Type: Database (PostgreSQL/MySQL)
Database Type: PostgreSQL
URL: postgresql://postgres:5432
Username: monitoring
Password: monitoring_password
Database Name: monitoring_system
```

**Result**: ✅ Healthy (within 60 seconds)

---

### Example 2: Monitor External PostgreSQL

```yaml
Service Name: Production PostgreSQL
Service Type: Database (PostgreSQL/MySQL)
Database Type: PostgreSQL
URL: postgresql://188.166.196.124:15434
Username: postgres
Password: your_password
Database Name: bmdsalesdb
```

**Result**: ✅ Healthy (if network accessible)

---

### Example 3: Monitor Host Machine's MySQL

```yaml
Service Name: Local MySQL
Service Type: Database (PostgreSQL/MySQL)
Database Type: MySQL/MariaDB
URL: mysql://host.docker.internal:3306
Username: root
Password: root_password
Database Name: test
```

**Result**: ✅ Healthy (if MySQL running on host)

---

## 🐛 Troubleshooting Guide

### Problem: "Connection refused (os error 111)"

**Symptom**:
```
PostgreSQL connection failed: error communicating with database: 
Connection refused (os error 111)
```

**Diagnosis**:
```bash
# Check what URL is stored
docker exec monitoring-postgres psql -U monitoring -d monitoring_system -c \
  "SELECT name, url, username FROM endpoints WHERE service_type = 'database';"
```

**Fix**:
- If URL contains `localhost` → Change to Docker service name
- If monitoring Docker service → Use service name (`postgres`, `mysql`, etc.)
- If monitoring host → Use `host.docker.internal` or IP `192.168.10.69`
- If monitoring remote → Use actual IP/domain

---

### Problem: "password authentication failed"

**Symptom**:
```
PostgreSQL connection failed: password authentication failed for user "monitoring"
```

**Diagnosis**:
- URL and host are correct
- Credentials are wrong

**Fix**:
```bash
# Check password in docker-compose.yml
grep -A 3 "POSTGRES_PASSWORD" docker-compose.yml

# Verify credentials
docker exec monitoring-postgres psql -U monitoring -d monitoring_system -c 'SELECT 1;'
```

---

### Problem: "database does not exist"

**Symptom**:
```
PostgreSQL connection failed: database "xyz" does not exist
```

**Fix**:
```bash
# List available databases
docker exec monitoring-postgres psql -U monitoring -c '\l'

# Update database name
UPDATE endpoints SET database_name = 'correct_name' WHERE id = 'your-endpoint-id';
```

---

### Problem: Works from console but not from checker

**Common Cause**: Using different hostnames

**Your Console** (from host machine):
```bash
pg_isready -h localhost -U monitoring -d monitoring_system
# ✅ Works - localhost = your computer
```

**Checker Container**:
```bash
# Inside container, localhost = the container itself
postgresql://localhost:5432
# ❌ Fails - no database inside checker container
```

**Fix**: Use Docker service name in dashboard
```
URL: postgresql://postgres:5432
```

---

## 📝 Quick Reference Card

### When Adding Database Services

**Question**: Where is the database running?

1. **Same Docker Compose Stack**
   - URL: `postgresql://[SERVICE_NAME]:5432`
   - Example: `postgresql://postgres:5432`

2. **On Your Computer (Host)**
   - URL: `postgresql://host.docker.internal:5432`
   - Or: `postgresql://192.168.10.69:5432`

3. **On Another Server**
   - URL: `postgresql://[IP_OR_DOMAIN]:5432`
   - Example: `postgresql://188.166.196.124:15434`

4. **Never Use**
   - ❌ `postgresql://localhost:5432` (from checker perspective)

---

## 🔄 Migration Script

If you have many services using `localhost`, here's a script to fix them:

```bash
# Enter PostgreSQL
docker exec -it monitoring-postgres psql -U monitoring -d monitoring_system

# Update all localhost references to Docker service names
UPDATE endpoints 
SET url = REPLACE(url, 'localhost', 'postgres')
WHERE service_type = 'database' 
AND url LIKE '%localhost%'
AND url LIKE '%5432%';

UPDATE endpoints 
SET url = REPLACE(url, 'localhost', 'mysql')
WHERE service_type = 'database' 
AND url LIKE '%localhost%'
AND url LIKE '%3306%';

UPDATE endpoints 
SET url = REPLACE(url, 'localhost', 'api-gateway')
WHERE service_type IN ('backend', 'api')
AND url LIKE '%localhost:8080%';

-- Verify changes
SELECT id, name, url FROM endpoints WHERE url LIKE '%postgres%' OR url LIKE '%mysql%';
```

---

## ✅ Verification Steps

### 1. Check URL Format
```sql
SELECT name, service_type, url 
FROM endpoints 
WHERE service_type = 'database';
```

Should show:
- ✅ `postgresql://postgres:5432`
- ✅ `postgresql://188.166.196.124:15434`
- ❌ `postgresql://localhost:5432`

### 2. Test Connection from Checker
```bash
docker exec monitoring-checker sh -c "
  apk add --no-cache postgresql-client && 
  psql postgresql://monitoring:monitoring_password@postgres:5432/monitoring_system -c 'SELECT NOW();'
"
```

Should output current timestamp.

### 3. Check Health Check Results
```sql
SELECT e.name, hc.check_status, hc.error_message, hc.checked_at 
FROM health_checks hc
JOIN endpoints e ON hc.endpoint_id = e.id
WHERE e.service_type = 'database'
ORDER BY hc.checked_at DESC
LIMIT 5;
```

Should show:
- ✅ `check_status = 'success'`
- ❌ No "Connection refused" errors

---

## 📚 Additional Resources

### Docker Networking Documentation
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [Container-to-Container Communication](https://docs.docker.com/network/drivers/bridge/)

### Testing Tools
```bash
# Test network connectivity between containers
docker exec monitoring-checker ping postgres

# Check if port is open
docker exec monitoring-checker nc -zv postgres 5432

# DNS resolution
docker exec monitoring-checker nslookup postgres
```

---

## 🎉 Summary

**Problem**: `localhost` inside Docker containers refers to the container itself, not other containers or the host.

**Solution**: Use proper hostnames:
- Docker services: Use service name (`postgres`, `mysql`)
- Host machine: Use `host.docker.internal` or IP
- External: Use actual IP/domain

**Critical**: Update ALL database URLs in your monitoring system to use correct hostnames!

**After fixing**: Your database health checks will show ✅ Healthy within 60 seconds!
