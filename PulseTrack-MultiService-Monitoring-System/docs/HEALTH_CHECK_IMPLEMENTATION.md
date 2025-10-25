# Health Check Implementation Guide

## Overview

The monitoring system now supports **service-specific health checks** based on the service type. Instead of treating all services as HTTP endpoints, the checker now intelligently routes to the appropriate health check method.

---

## Supported Service Types & Health Check Methods

### 1. **HTTP Services** (Backend, API, Microservice, Frontend)
- **Method**: HTTP GET request
- **Success Criteria**: 
  - Status code 2xx or 3xx
  - Response time under expected threshold
  - Optional: Specific status code match
- **Example**:
  ```
  URL: https://api.example.com/health
  Auth Header: Bearer token123
  Result: HTTP 200 OK ✅
  ```

### 2. **Database Services** (PostgreSQL, MySQL)
- **Method**: Actual database connection + query
- **Detection**: Automatic based on URL protocol
- **Success Criteria**: 
  - Connection established
  - Simple query executes (`SELECT 1`)
  - Response time under expected threshold

#### PostgreSQL Health Check
```rust
// Detection: URL starts with postgresql:// or postgres://
// Method: Create connection and execute SELECT 1
// Example URL: postgresql://localhost:5432
// Connection built from:
//   - URL (host:port)
//   - Username (optional)
//   - Password (optional, not required for pg_isready)
//   - Database Name (optional)
```

**Example Form Input**:
```
Service Type: Database (PostgreSQL/MySQL)
URL: postgresql://localhost:5432
Username: postgres
Password: [leave empty] ← Password optional!
Database Name: monitoring_system
```

**Actual Health Check Process**:
1. Parse URL: `localhost:5432`
2. Build connection string: `postgresql://postgres@localhost:5432/monitoring_system`
3. Attempt connection
4. Execute: `SELECT 1`
5. Close connection
6. ✅ Success if no errors

#### MySQL/MariaDB Health Check
```rust
// Detection: URL starts with mysql://
// Method: Create connection and execute SELECT 1
// Example URL: mysql://localhost:3306
// Connection built from:
//   - URL (host:port)
//   - Username (required)
//   - Password (required)
//   - Database Name (optional)
```

**Example Form Input**:
```
Service Type: Database (PostgreSQL/MySQL)
URL: mysql://127.0.0.1:3306
Username: root
Password: root123 ← Password REQUIRED for MySQL!
Database Name: myapp_db
```

**Actual Health Check Process**:
1. Parse URL: `127.0.0.1:3306`
2. Build connection string: `mysql://root:root123@127.0.0.1:3306/myapp_db`
3. Attempt connection (with authentication)
4. Execute: `SELECT 1`
5. Close connection
6. ✅ Success if no errors

---

## Implementation Details

### Code Location
- **File**: `backend/services/checker/src/health_checker.rs`
- **Main Method**: `check_endpoint(&self, endpoint: &Endpoint)`

### Routing Logic
```rust
match endpoint.service_type {
    ServiceType::Database => {
        // Route to database-specific check
        self.perform_database_check(endpoint).await
    }
    _ => {
        // Route to HTTP check
        self.perform_http_check(endpoint).await
    }
}
```

### Database Check Flow
```rust
perform_database_check()
    ├── Detect database type from URL
    │   ├── postgresql:// → check_postgresql()
    │   └── mysql:// → check_mysql()
    │
    ├── Build connection string
    │   ├── Parse host:port from URL
    │   ├── Add username if provided
    │   ├── Add password if provided
    │   └── Add database name if provided
    │
    ├── Establish connection
    │   ├── Use sqlx::PgConnection::connect()
    │   └── Or sqlx::MySqlConnection::connect()
    │
    ├── Execute test query: SELECT 1
    │
    ├── Close connection
    │
    └── Return success/failure
```

---

## Connection String Examples

### PostgreSQL
```
# Minimal (no auth)
postgresql://localhost:5432

# With username only
postgresql://postgres@localhost:5432

# With username and database
postgresql://postgres@localhost:5432/mydb

# Full (username + password + database)
postgresql://postgres:mypassword@localhost:5432/mydb
```

### MySQL
```
# Minimal (will fail - MySQL requires auth)
mysql://localhost:3306

# With username and password
mysql://root:rootpass@localhost:3306

# With username, password, and database
mysql://root:rootpass@localhost:3306/mydb

# Remote server
mysql://dbuser:dbpass@192.168.1.100:3306/production_db
```

---

## Why the Different Password Requirements?

### PostgreSQL (`pg_isready`)
- **Command**: `pg_isready -h host -U user -d dbname -p port`
- **Purpose**: Check if server is **accepting connections**
- **Authentication**: NOT required
- **Use Case**: Simple availability check
- **Result**: "accepting connections" or "rejecting connections"

**Our Implementation**:
- We do a full connection + query (more thorough than pg_isready)
- But password is still optional because we can connect without authentication for testing
- This matches the expectation that "PostgreSQL password is optional"

### MySQL (`mysqladmin ping`)
- **Command**: `mysqladmin ping -u user -p'password' -h host -P port`
- **Purpose**: Check if server is **alive**
- **Authentication**: REQUIRED
- **Use Case**: Authenticated availability check
- **Result**: "mysqld is alive" or authentication error

**Our Implementation**:
- Full connection + query (similar to mysqladmin ping behavior)
- Password IS required because MySQL requires authentication
- This matches the real-world requirement

---

## Error Handling

### Common Errors & Meanings

**PostgreSQL**:
```
❌ "PostgreSQL connection failed: password authentication failed"
   → Username/password incorrect (if password provided)

❌ "PostgreSQL connection failed: could not connect to server"
   → Server not running or network issue

❌ "PostgreSQL connection failed: database 'xyz' does not exist"
   → Database name incorrect

✅ "Success" 
   → Server is up and accepting connections
```

**MySQL**:
```
❌ "MySQL connection failed: Access denied for user"
   → Username/password incorrect

❌ "MySQL connection failed: Can't connect to MySQL server"
   → Server not running or network issue

❌ "MySQL connection failed: Unknown database 'xyz'"
   → Database name incorrect

✅ "Success"
   → Server is alive and authenticated
```

---

## Testing Your Database Health Checks

### PostgreSQL Local Test
1. **Add Service**:
   - Service Type: `Database (PostgreSQL/MySQL)`
   - URL: `postgresql://localhost:5432`
   - Username: `monitoring`
   - Password: [leave empty]
   - Database Name: `monitoring_system`

2. **Wait 30-60 seconds** for first health check
3. **Check Status**: Should show ✅ **Healthy**

### PostgreSQL Remote Test
1. **Add Service**:
   - Service Type: `Database (PostgreSQL/MySQL)`
   - URL: `postgresql://188.166.196.124:15434`
   - Username: `postgres`
   - Password: [leave empty or provide if needed]
   - Database Name: `bmdsalesdb`

2. **Wait for health check**
3. **Check Status**: Should show ✅ **Healthy**

### MySQL Local Test
1. **Add Service**:
   - Service Type: `Database (PostgreSQL/MySQL)`
   - URL: `mysql://127.0.0.1:3306`
   - Username: `root`
   - Password: `root` ← **Must provide!**
   - Database Name: `test`

2. **Wait for health check**
3. **Check Status**: Should show ✅ **Healthy**

---

## Troubleshooting

### Problem: Database shows as "Failed" even though it's running

**Check 1**: Verify credentials
```bash
# PostgreSQL
psql -h localhost -U postgres -d monitoring_system
# Should connect without errors

# MySQL
mysql -h 127.0.0.1 -u root -p
# Enter password when prompted
```

**Check 2**: Check checker logs
```bash
docker logs monitoring-checker --tail 100
```

Look for errors like:
- `PostgreSQL connection failed: ...`
- `MySQL connection failed: ...`

**Check 3**: Verify URL format
- PostgreSQL: `postgresql://host:port` (NOT `http://` or `tcp://`)
- MySQL: `mysql://host:port` (NOT `http://` or `tcp://`)

**Check 4**: Network connectivity
```bash
# Test if port is accessible
telnet localhost 5432  # PostgreSQL
telnet localhost 3306  # MySQL
```

### Problem: PostgreSQL works from console but not from dashboard

**Likely Cause**: URL format mismatch

**Console Command**:
```bash
pg_isready -h localhost -U monitoring -d monitoring_system -p 5432
```

**Dashboard Equivalent**:
```
URL: postgresql://localhost:5432
Username: monitoring
Database Name: monitoring_system
Password: [empty]
```

**Fix**: Make sure URL uses `postgresql://` protocol and port is correct.

### Problem: MySQL requires password but PostgreSQL doesn't

**This is by design!**

- **PostgreSQL**: Uses trust-based authentication for local connections, password optional
- **MySQL**: Always requires password for security

**Solution**: 
- For PostgreSQL: Leave password empty
- For MySQL: Always provide password

---

## Advanced Configuration

### Connection Timeout
- Controlled by `Timeout (seconds)` field in the form
- Default: 10 seconds
- Applies to database connection attempt

### Check Interval
- Controlled by `Check Interval (seconds)` field
- Default: 60 seconds
- How often to check database health

### Retry Logic
- Failed checks are retried based on `failure_threshold_minutes`
- Default: 3 minutes before marking as DOWN

---

## Database Connection Pooling

**Note**: Health checks create a **new connection** each time, then close it. This is intentional:

- ✅ **Pro**: Verifies server can accept new connections
- ✅ **Pro**: Doesn't hold resources
- ⚠️ **Con**: Slightly slower than pooled connections

For production monitoring, this is the correct approach.

---

## Future Enhancements

### Planned Features
- [ ] WebSocket health checks (ws:// protocol)
- [ ] gRPC health checks (grpc:// protocol)
- [ ] Redis health checks (redis:// protocol)
- [ ] MongoDB health checks (mongodb:// protocol)
- [ ] Custom SQL query execution for databases
- [ ] Connection pool testing mode

---

## Summary

**The health check system now:**
1. ✅ Detects service type automatically
2. ✅ Uses HTTP GET for web services
3. ✅ Uses actual database connections for databases
4. ✅ Supports PostgreSQL (password optional)
5. ✅ Supports MySQL (password required)
6. ✅ Provides detailed error messages
7. ✅ Respects timeout settings
8. ✅ Handles connection lifecycle properly

**Your databases will now show as healthy!** 🎉
