# Multi-Service Types Support Guide

## Overview

Your Service Monitoring System now supports **7 different service types** with type-specific authentication mechanisms:

1. **Frontend** (Public websites - No auth required)
2. **Backend** (HTTP APIs with Bearer/API key)
3. **Microservice** (HTTP services with auth)
4. **API** (REST/GraphQL APIs with auth)
5. **Database** (PostgreSQL, MySQL with username/password)
6. **WebSocket** (ws:// and wss:// connections)
7. **gRPC** (grpc:// protocol services)

---

## 🎯 Key Features Implemented

### 1. **Dynamic Form Fields**
- Form automatically shows relevant fields based on service type
- **HTTP Services** (Backend, API, Microservice): Show "Authorization Header" field
- **Database Services**: Show Username, Password, and Database Name fields
- **WebSocket/gRPC**: Standard URL validation with protocol-specific placeholders

### 2. **Database Migrations**
- **006_add_service_credentials.sql**: Adds `username`, `password`, `database_name`, `connection_params` columns
- **007_add_new_service_types.sql**: Extends `service_type` enum to include `websocket` and `grpc`

### 3. **Backend Models Updated**
- `ServiceType` enum extended with WebSocket and gRPC
- `Endpoint` struct includes new credential fields
- `CreateEndpointRequest` and `UpdateEndpointRequest` support new fields

### 4. **Frontend TypeScript Types**
- `ServiceType` updated to include all 7 types
- `Endpoint` interface includes credential fields
- Dynamic form validation based on service type

---

## 📋 How to Add Different Service Types

### **1. Frontend Service (Public Website)**
```
Service Type: Frontend
URL: https://example.com
Auth: Not required ❌
```

**Use Case**: Monitor your marketing website, landing pages, or public-facing apps.

---

### **2. Backend/API Service (HTTP with Auth)**
```
Service Type: Backend (or API/Microservice)
URL: https://api.example.com/health
Authorization Header: Bearer eyJhbGc1NiIsInR5cCI6IkpXVCJ9...
```

**Examples**:
- `Bearer <token>` - JWT authentication
- `ApiKey <your-api-key>` - API key authentication
- `Basic <base64-credentials>` - Basic auth

**Use Case**: Monitor REST APIs, GraphQL endpoints, microservices.

---

### **3. Database Service (PostgreSQL/MySQL)**
```
Service Type: Database
URL: postgresql://localhost:5432  (or mysql://localhost:3306)
Username: postgres (or root for MySQL)
Password: your_database_password
Database Name: monitoring_system
```

**Health Check Commands Used**:
- **PostgreSQL**: `pg_isready -h localhost -U postgres -d monitoring_system`
- **MySQL**: `mysqladmin ping -u root -p'password' -h localhost -P 3306`

**Use Case**: Monitor database availability and connectivity.

---

### **4. WebSocket Service**
```
Service Type: WebSocket
URL: ws://example.com/ws  (or wss://example.com/ws for secure)
Auth: Typically handled at application level
```

**Note**: WebSocket authentication is usually done via:
- Query parameters: `ws://example.com/ws?token=abc123`
- Initial handshake message
- Connection headers (configured in your app)

**Use Case**: Monitor real-time chat apps, live dashboards, streaming services.

---

### **5. gRPC Service**
```
Service Type: gRPC
URL: grpc://example.com:50051
Auth: Typically handled via interceptors in your gRPC service
```

**Note**: gRPC authentication patterns:
- Metadata/headers sent with each call
- TLS mutual authentication
- Token-based auth via interceptors

**Use Case**: Monitor microservices using gRPC protocol.

---

## 🔧 Implementation Details

### **Database Schema Changes**

```sql
-- New columns added to endpoints table
ALTER TABLE endpoints 
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS database_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS connection_params JSONB DEFAULT '{}'::jsonb;

-- New service types added
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'websocket';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'grpc';
```

### **Frontend Form Logic**

```typescript
// Dynamic field display based on service type
const requiresAuthHeader = ['backend', 'api', 'microservice'].includes(formData.service_type)
const requiresDbCredentials = formData.service_type === 'database'

// Dynamic URL placeholders
const getUrlPlaceholder = () => {
  switch (formData.service_type) {
    case 'database':
      return 'postgresql://localhost:5432 or mysql://localhost:3306'
    case 'websocket':
      return 'ws://example.com/ws or wss://example.com/ws'
    case 'grpc':
      return 'grpc://example.com:50051'
    default:
      return 'https://api.example.com/health'
  }
}
```

---

## 🚀 Usage Examples

### **Example 1: Add PostgreSQL Database**
1. Click "+ Add Service" from dashboard
2. Fill in:
   - **Name**: "Production PostgreSQL"
   - **Service Type**: "Database (PostgreSQL/MySQL)"
   - **URL**: `postgresql://localhost:5432`
   - **Username**: `postgres`
   - **Password**: `your_password`
   - **Database Name**: `myapp_production`
3. Click "Add Endpoint"

**Result**: System will run `pg_isready` checks every 60 seconds.

---

### **Example 2: Add WebSocket Service**
1. Click "+ Add Service"
2. Fill in:
   - **Name**: "Chat WebSocket"
   - **Service Type**: "WebSocket (ws://)"
   - **URL**: `wss://chat.example.com/ws`
3. Click "Add Endpoint"

**Note**: If your WebSocket requires token auth, append it to URL:
```
wss://chat.example.com/ws?token=abc123
```

---

### **Example 3: Add gRPC Service**
1. Click "+ Add Service"
2. Fill in:
   - **Name**: "User Service gRPC"
   - **Service Type**: "gRPC (grpc://)"
   - **URL**: `grpc://userservice.example.com:50051`
3. Click "Add Endpoint"

---

## 🔐 Security Considerations

### **Database Credentials**
- ✅ Passwords are stored encrypted in the database
- ✅ Never logged in application logs
- ✅ Transmitted over HTTPS only
- ⚠️ **Best Practice**: Use read-only database users for monitoring

### **API Tokens**
- ✅ Stored in `auth_header` field
- ✅ Encrypted at rest
- ⚠️ **Best Practice**: Use dedicated monitoring API keys with minimal permissions

### **WebSocket/gRPC Auth**
- ✅ Auth tokens embedded in URLs or configured at app level
- ⚠️ **Best Practice**: Use TLS (wss://, grpcs://) for production

---

## 📊 Health Check Mechanisms

| Service Type | Health Check Method | Example |
|--------------|---------------------|---------|
| Frontend | HTTP GET request | `GET https://example.com` |
| Backend/API | HTTP GET with auth header | `GET /health` with `Authorization: Bearer ...` |
| Microservice | HTTP GET with auth | Same as Backend |
| Database (PostgreSQL) | `pg_isready` command | `pg_isready -h localhost -U user -d dbname` |
| Database (MySQL) | `mysqladmin ping` | `mysqladmin ping -u root -p'pass' -h host` |
| WebSocket | WebSocket connection test | Connect to `ws://` endpoint |
| gRPC | gRPC health check protocol | Call health check RPC method |

---

## 🎨 UI/UX Features

### **Color-Coded Sections**
- **Blue Section**: Authorization Header (HTTP services)
- **Purple Section**: Database Credentials
- **Info Icons**: Contextual help for each field

### **Dynamic Placeholders**
- URL field shows relevant example based on service type
- Helpful tooltips and examples for each auth method

### **Form Validation**
- Required fields enforced
- URL format validation per service type
- Secure password input fields

---

## 🛠️ Future Enhancements (Recommended)

### **Phase 1: Enhanced Database Support**
- [ ] Auto-detect database type from URL
- [ ] Support for MongoDB, Redis, Elasticsearch
- [ ] Custom health check queries
- [ ] Connection pooling metrics

### **Phase 2: Advanced Protocol Support**
- [ ] MQTT broker monitoring
- [ ] Kafka cluster health checks
- [ ] RabbitMQ queue monitoring
- [ ] GraphQL introspection

### **Phase 3: Authentication Extensions**
- [ ] OAuth 2.0 token refresh
- [ ] Certificate-based authentication (mTLS)
- [ ] SSH tunnel support for databases
- [ ] Vault integration for secrets

---

## 🐛 Troubleshooting

### **Database Connection Issues**

**Problem**: "Failed to connect to database"

**Solutions**:
1. Verify credentials are correct
2. Check database allows remote connections
3. Ensure firewall allows traffic on database port
4. Test with: `pg_isready -h <host> -U <user> -d <dbname>`

### **WebSocket Connection Fails**

**Problem**: "WebSocket connection timeout"

**Solutions**:
1. Verify URL starts with `ws://` or `wss://`
2. Check if service requires authentication token in URL
3. Ensure WebSocket server is running
4. Test with browser dev tools or `wscat`

### **gRPC Health Checks**

**Problem**: "gRPC service unreachable"

**Solutions**:
1. Verify URL uses `grpc://` protocol
2. Check port number is correct (commonly 50051)
3. Ensure gRPC server has health check endpoint implemented
4. Test with `grpcurl` tool

---

## 📝 API Payload Examples

### **Create Database Endpoint**
```json
{
  "name": "Production PostgreSQL",
  "url": "postgresql://localhost:5432",
  "service_type": "database",
  "username": "monitoring_user",
  "password": "secure_password",
  "database_name": "myapp_production",
  "check_interval_seconds": 60,
  "timeout_seconds": 10
}
```

### **Create WebSocket Endpoint**
```json
{
  "name": "Chat WebSocket",
  "url": "wss://chat.example.com/ws",
  "service_type": "websocket",
  "check_interval_seconds": 30,
  "timeout_seconds": 5
}
```

### **Create gRPC Endpoint**
```json
{
  "name": "User Service gRPC",
  "url": "grpc://userservice.example.com:50051",
  "service_type": "grpc",
  "check_interval_seconds": 60,
  "timeout_seconds": 10
}
```

---

## ✅ Migration Checklist

When deploying these changes to production:

- [ ] Run database migrations in order:
  - `006_add_service_credentials.sql`
  - `007_add_new_service_types.sql`
- [ ] Restart all backend services (api-gateway, checker)
- [ ] Rebuild and deploy frontend
- [ ] Test each service type with sample endpoints
- [ ] Update documentation for your team
- [ ] Set up monitoring for the monitor (meta-monitoring)

---

## 🎯 Summary

You can now monitor **any type of service** with appropriate authentication:

- ✅ **HTTP/REST APIs** → Authorization Header
- ✅ **Databases** → Username/Password
- ✅ **WebSockets** → URL-based or app-level auth
- ✅ **gRPC** → Protocol-native auth
- ✅ **Frontend websites** → No auth needed

The system automatically adapts the form and health check mechanism based on the service type you select!

---

**Need help?** Check the troubleshooting section or review the implementation code in:
- Frontend: `/frontend/src/components/dashboard/add-endpoint-dialog.tsx`
- Backend Models: `/backend/shared/models/src/endpoint.rs`
- API Handler: `/backend/services/api-gateway/src/handlers/endpoints.rs`
