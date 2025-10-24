# API Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication

Most endpoints require authentication using JWT tokens in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Register Organization

Creates a new organization and admin user.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "org_name": "Acme Inc",
  "org_slug": "acme-inc",
  "org_contact_email": "contact@acme.com",
  "admin_email": "admin@acme.com",
  "admin_password": "SecurePassword123",
  "admin_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "org_id": "uuid",
    "user_id": "uuid",
    "access_token": "jwt_token",
    "refresh_token": "jwt_token"
  }
}
```

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@acme.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "jwt_token",
    "user": {
      "id": "uuid",
      "org_id": "uuid",
      "email": "admin@acme.com",
      "name": "John Doe",
      "role": "admin"
    }
  }
}
```

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "jwt_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token"
  }
}
```

## Organizations

### Get Organization

**Endpoint:** `GET /organizations/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "contact_email": "contact@acme.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

### Update Organization

**Endpoint:** `PUT /organizations/:id`

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "contact_email": "new-contact@acme.com"
}
```

## Endpoints

### List Endpoints

**Endpoint:** `GET /endpoints`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (UP, DOWN, PARTIAL_OUTAGE, UNKNOWN)
- `service_type` (optional): Filter by service type

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "org_id": "uuid",
        "name": "API Service",
        "url": "https://api.example.com/health",
        "service_type": "backend",
        "description": "Main API service",
        "tags": ["production", "critical"],
        "owner_contact": "ops@example.com",
        "check_interval_seconds": 60,
        "timeout_seconds": 10,
        "expected_status_code": 200,
        "expected_response_time_ms": 500,
        "failure_threshold_minutes": 3,
        "retry_count": 2,
        "retry_delay_seconds": 5,
        "status": "UP",
        "last_check_at": "2024-01-01T00:00:00Z",
        "last_status_change_at": "2024-01-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "is_active": true
      }
    ],
    "total": 10,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  }
}
```

### Get Endpoint

**Endpoint:** `GET /endpoints/:id`

**Response:** Same as single endpoint object above.

### Create Endpoint

**Endpoint:** `POST /endpoints`

**Request Body:**
```json
{
  "name": "API Service",
  "url": "https://api.example.com/health",
  "service_type": "backend",
  "description": "Main API service",
  "tags": ["production", "critical"],
  "owner_contact": "ops@example.com",
  "check_interval_seconds": 60,
  "timeout_seconds": 10,
  "expected_status_code": 200,
  "expected_response_time_ms": 500,
  "failure_threshold_minutes": 3,
  "retry_count": 2
}
```

**Response:** Created endpoint object.

### Update Endpoint

**Endpoint:** `PUT /endpoints/:id`

**Request Body:** Partial endpoint object with fields to update.

### Delete Endpoint

**Endpoint:** `DELETE /endpoints/:id`

**Response:**
```json
{
  "success": true
}
```

## Health Checks

### Get Endpoint History

**Endpoint:** `GET /endpoints/:id/history`

**Query Parameters:**
- `days` (optional): Number of days of history (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "endpoint_id": "uuid",
    "endpoint_name": "API Service",
    "checks": [
      {
        "id": "uuid",
        "endpoint_id": "uuid",
        "check_status": "success",
        "response_time_ms": 250,
        "status_code": 200,
        "failure_reason": null,
        "error_message": null,
        "checked_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total_checks": 100,
    "successful_checks": 98,
    "failed_checks": 2,
    "avg_response_time_ms": 245.5,
    "uptime_percentage": 98.0
  }
}
```

### Get Endpoint Stats

**Endpoint:** `GET /endpoints/:id/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "endpoint_id": "uuid",
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-31T00:00:00Z",
    "total_uptime_seconds": 2592000,
    "total_downtime_seconds": 3600,
    "uptime_percentage": 99.86,
    "incident_count": 2,
    "avg_response_time_ms": 245.5
  }
}
```

## Notification Channels

### List Channels

**Endpoint:** `GET /notification-channels`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "name": "Team Email",
      "channel_type": "email",
      "config": {
        "type": "email",
        "to_addresses": ["team@example.com"]
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Channel

**Endpoint:** `POST /notification-channels`

**Request Body (Email):**
```json
{
  "name": "Team Email",
  "channel_type": "email",
  "config": {
    "type": "email",
    "to_addresses": ["team@example.com", "ops@example.com"]
  }
}
```

**Request Body (Slack):**
```json
{
  "name": "Slack Alerts",
  "channel_type": "slack",
  "config": {
    "type": "slack",
    "webhook_url": "https://hooks.slack.com/services/...",
    "channel": "#alerts"
  }
}
```

**Request Body (Discord):**
```json
{
  "name": "Discord Alerts",
  "channel_type": "discord",
  "config": {
    "type": "discord",
    "webhook_url": "https://discord.com/api/webhooks/..."
  }
}
```

**Request Body (MS Teams):**
```json
{
  "name": "Teams Alerts",
  "channel_type": "msteams",
  "config": {
    "type": "msteams",
    "webhook_url": "https://outlook.office.com/webhook/..."
  }
}
```

### Delete Channel

**Endpoint:** `DELETE /notification-channels/:id`

## Notifications

### List Notifications

**Endpoint:** `GET /notifications`

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "org_id": "uuid",
        "endpoint_id": "uuid",
        "channel_id": "uuid",
        "notification_type": "ENDPOINT_DOWN",
        "status": "sent",
        "subject": "Service Down: API Service",
        "message": "The API Service is currently down.",
        "error_message": null,
        "sent_at": "2024-01-01T00:00:00Z",
        "acknowledged_at": null,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

### Acknowledge Notifications

**Endpoint:** `POST /notifications/acknowledge`

**Request Body:**
```json
{
  "notification_ids": ["uuid1", "uuid2"]
}
```

## Users

### List Users

**Endpoint:** `GET /users`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "member",
      "is_active": true,
      "last_login_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create User

**Endpoint:** `POST /users` (Admin only)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "name": "New User",
  "role": "member"
}
```

### Update User

**Endpoint:** `PUT /users/:id` (Admin only)

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": false
}
```

### Delete User

**Endpoint:** `DELETE /users/:id` (Admin only)

## WebSocket

### Connect

**URL:** `ws://localhost:8080/ws?token=<access_token>`

### Events

The WebSocket connection sends real-time events:

**endpoint_status_changed:**
```json
{
  "id": "uuid",
  "event": {
    "type": "endpoint_status_changed",
    "endpoint_id": "uuid",
    "org_id": "uuid",
    "endpoint_name": "API Service",
    "old_status": "UP",
    "new_status": "DOWN",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "published_at": "2024-01-01T00:00:00Z"
}
```

**endpoint_check_completed:**
```json
{
  "id": "uuid",
  "event": {
    "type": "endpoint_check_completed",
    "endpoint_id": "uuid",
    "org_id": "uuid",
    "success": true,
    "response_time_ms": 250,
    "status_code": 200,
    "failure_reason": null,
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "published_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
