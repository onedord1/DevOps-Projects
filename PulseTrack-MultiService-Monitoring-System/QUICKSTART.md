# Quick Start Guide

Get the Multi-Service Monitoring System up and running in minutes.

## Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git** (for cloning the repository)
- 4GB RAM minimum, 8GB recommended
- Ports 3000, 8080, 5432, and 6379 available

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd service-monitoring-system
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Create environment configuration files
- Generate a secure JWT secret
- Build Docker images
- Start all services
- Verify service health

**Note:** First build may take 10-15 minutes as it compiles Rust services.

### 3. Access the Application

Open your browser and navigate to:

**Frontend:** http://localhost:3000

## First Steps

### 1. Register Your Organization

1. Click **"Register"** on the login page
2. Fill in your organization details:
   - Organization Name: `Your Company`
   - Organization Slug: `your-company` (auto-generated)
   - Contact Email: `contact@yourcompany.com`
3. Create your admin account:
   - Name: `Your Name`
   - Email: `admin@yourcompany.com`
   - Password: (minimum 8 characters)
4. Click **"Create Organization"**

You'll be automatically logged in and redirected to the dashboard.

### 2. Add Your First Service

1. Click the **"+ Add Service"** button
2. Fill in service details:
   - **Service Name:** `My API`
   - **Endpoint URL:** `https://api.yourservice.com/health`
   - **Service Type:** Backend
   - **Check Interval:** 60 seconds (default)
   - **Timeout:** 10 seconds (default)
   - **Failure Threshold:** 3 minutes (default)
3. Optionally add:
   - Description
   - Tags (comma-separated): `production, critical`
4. Click **"Create Endpoint"**

The service will appear on your dashboard and start being monitored immediately!

### 3. Configure Notifications

1. Navigate to **Settings** in the sidebar
2. Click **"Add Notification Channel"**
3. Choose a channel type:

**Email:**
```
Name: Team Email
Type: Email
Recipients: team@yourcompany.com, ops@yourcompany.com
```

**Slack:**
```
Name: Slack Alerts
Type: Slack
Webhook URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Channel: #alerts
```

**Discord:**
```
Name: Discord Alerts
Type: Discord
Webhook URL: https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

4. Click **"Create Channel"**

You'll now receive alerts when services go down!

## Understanding the Dashboard

### Service Cards

Each monitored service is displayed as a card showing:

- **Name and URL** - Service identifier
- **Status Border:**
  - 🟢 **Green:** Service is UP
  - 🟡 **Yellow:** Partial Outage
  - 🔴 **Red:** Service is DOWN
  - ⚪ **Gray:** Status Unknown
- **Last Check Time** - When the service was last checked
- **Tags** - Custom labels for organization

### Stats Overview

Top of the dashboard shows:
- **Total Services** - Number of monitored endpoints
- **Healthy** - Services currently UP
- **Degraded** - Services with partial outage
- **Down** - Services currently unavailable

### Real-Time Updates

The dashboard updates automatically via WebSocket:
- Status changes appear instantly
- Green indicator in sidebar shows connection status
- No page refresh needed

## Common Tasks

### View Service History

1. Click on any service card
2. View detailed information:
   - Uptime percentage (last 30 days)
   - Average response time
   - Recent health checks
   - Configuration details
3. Scroll through check history

### Filter Services

Use the filter bar to:
- **Search** by name or URL
- **Filter by Status:** UP, DOWN, Partial Outage
- **Filter by Type:** Frontend, Backend, etc.
- Click **"Clear Filters"** to reset

### Add Team Members

1. Go to **Users** in the sidebar
2. Click **"+ Add User"**
3. Enter user details:
   - Email
   - Name
   - Password
   - Role (admin, member, or viewer)
4. User can now log in with their credentials

### Edit Service Configuration

1. Click on a service card
2. Update check interval, timeout, or other settings
3. Changes take effect on next check cycle

## Stopping the System

```bash
# Stop all services
make down

# Or using docker-compose
docker-compose down

# Stop and remove all data (CAUTION)
make clean
```

## Restarting the System

```bash
# Start services
make up

# Or restart existing services
make restart
```

## Useful Commands

```bash
# View logs
make logs                 # All services
make logs-api            # API Gateway only
make logs-checker        # Checker service only

# Check service status
make ps                  # List running services
make check-health        # Verify health endpoints

# Database operations
make db-shell            # Open PostgreSQL shell
make backup-db           # Create database backup

# Help
make help                # Show all available commands
```

## Troubleshooting

### Services Won't Start

```bash
# Check service logs
docker-compose logs api-gateway

# Restart specific service
docker-compose restart api-gateway

# Rebuild if needed
docker-compose build api-gateway
docker-compose up -d api-gateway
```

### Can't Access Frontend

1. Verify service is running: `docker-compose ps frontend`
2. Check logs: `docker-compose logs frontend`
3. Ensure port 3000 is not in use: `lsof -i :3000`
4. Restart: `docker-compose restart frontend`

### WebSocket Not Connecting

1. Check API Gateway logs: `make logs-api`
2. Verify token is valid (logout and login again)
3. Check browser console for errors
4. Ensure WebSocket upgrade is allowed in firewall/proxy

### Notifications Not Sending

1. Check notification service logs: `make logs-notification`
2. Verify SMTP settings in `.env` file
3. Test email configuration manually
4. Ensure notification channels are active

### Database Connection Errors

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Verify DATABASE_URL in `.env`
4. Try restarting: `docker-compose restart postgres`

## Configuration

### Email Notifications (SMTP)

Edit `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@monitoring.yourcompany.com
```

**Gmail Users:** Use an [App Password](https://support.google.com/accounts/answer/185833)

**SendGrid Users:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

After updating `.env`, restart notification service:
```bash
docker-compose restart notification
```

### Changing Check Intervals

Edit `.env` to change global settings:

```bash
CHECK_INTERVAL_SECONDS=30  # Default global check interval
```

Or configure per-endpoint in the UI when creating/editing services.

## Next Steps

- **Read [README.md](README.md)** - Full system overview
- **Read [API.md](API.md)** - API documentation
- **Read [DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **Configure Alerts** - Set up critical alerting paths
- **Add More Services** - Monitor all your endpoints
- **Customize** - Adjust check intervals and thresholds

## Getting Help

- Check logs: `make logs`
- Review documentation in `README.md`
- Check API documentation in `API.md`
- Review troubleshooting section above

## What's Next?

Now that your monitoring system is running:

1. ✅ Add all critical services to monitor
2. ✅ Configure notification channels (email, Slack, etc.)
3. ✅ Invite team members
4. ✅ Set up proper alerting thresholds
5. ✅ Review service history regularly
6. ✅ Consider production deployment (see DEPLOYMENT.md)

Happy monitoring! 🚀
