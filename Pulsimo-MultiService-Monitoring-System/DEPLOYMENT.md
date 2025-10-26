# Deployment Guide

This guide covers different deployment options for the Multi-Service Monitoring System.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Production Considerations](#production-considerations)
- [Scaling](#scaling)
- [Monitoring](#monitoring)

## Prerequisites

### Required Software

- Docker 20.10+ and Docker Compose 2.0+
- PostgreSQL 15+
- Redis 7+
- Rust 1.90+ (for manual deployment)
- Node.js 20+ (for manual deployment)

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
   - Set a strong `JWT_SECRET`
   - Configure SMTP settings for email notifications
   - Update URLs for production deployment

## Docker Deployment

### Quick Start (Development)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Docker Deployment

1. **Update Environment Variables**

Create a `.env` file with production values:

```bash
JWT_SECRET=<generate-strong-random-secret>
DATABASE_URL=postgresql://monitoring:secure_password@postgres:5432/monitoring_system
SMTP_HOST=smtp.sendgrid.net
SMTP_USERNAME=apikey
SMTP_PASSWORD=<your-sendgrid-api-key>
```

2. **Build and Deploy**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check service health
docker-compose ps
```

3. **Initialize Database**

The database migrations run automatically on first start. To manually run migrations:

```bash
docker-compose exec postgres psql -U monitoring monitoring_system -f /docker-entrypoint-initdb.d/001_init.sql
```

4. **Access the Application**

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Health Check: http://localhost:8080/health

## Manual Deployment

### Backend Services

1. **Setup Database**

```bash
# Create database
createdb monitoring_system

# Run migrations
psql monitoring_system < backend/migrations/001_init.sql
```

2. **Build Backend Services**

```bash
cd backend

# Build all services
cargo build --release

# Or build individually
cargo build --release --package api-gateway
cargo build --release --package checker
cargo build --release --package notification
```

3. **Run Services**

In separate terminals:

```bash
# API Gateway
cd backend/services/api-gateway
DATABASE_URL=postgresql://localhost/monitoring_system \
REDIS_URL=redis://localhost:6379 \
JWT_SECRET=your-secret \
cargo run --release

# Checker Service
cd backend/services/checker
DATABASE_URL=postgresql://localhost/monitoring_system \
REDIS_URL=redis://localhost:6379 \
cargo run --release

# Notification Service
cd backend/services/notification
DATABASE_URL=postgresql://localhost/monitoring_system \
REDIS_URL=redis://localhost:6379 \
SMTP_HOST=smtp.gmail.com \
SMTP_USERNAME=your-email \
SMTP_PASSWORD=your-password \
cargo run --release
```

### Frontend

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Build and Run**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Production Considerations

### Security

1. **SSL/TLS**
   - Use a reverse proxy (nginx/traefik) with SSL certificates
   - Enable HTTPS for all endpoints
   - Use Let's Encrypt for free SSL certificates

2. **Secrets Management**
   - Use environment-specific secrets
   - Consider using a secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Never commit secrets to version control

3. **Database Security**
   - Use strong passwords
   - Enable SSL for database connections
   - Restrict database access to application servers only
   - Regular backups

### Reverse Proxy Configuration (Nginx)

```nginx
upstream api_backend {
    server localhost:8080;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name monitoring.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monitoring.example.com;

    ssl_certificate /etc/letsencrypt/live/monitoring.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Performance Optimization

1. **Database**
   - Add appropriate indexes
   - Use connection pooling
   - Consider read replicas for high load
   - Use TimescaleDB for time-series data

2. **Caching**
   - Use Redis for caching frequently accessed data
   - Implement API response caching
   - Use CDN for static assets

3. **Load Balancing**
   - Run multiple instances of each service
   - Use load balancer (HAProxy, nginx)
   - Implement health checks

## Scaling

### Horizontal Scaling

1. **API Gateway**
   - Run multiple instances behind a load balancer
   - Share session state via Redis

2. **Checker Service**
   - Run multiple instances
   - Each instance will pick up endpoints to check
   - Use distributed locking if needed

3. **Notification Service**
   - Run multiple instances
   - Process events from Redis pub/sub

### Database Scaling

1. **PostgreSQL**
   - Use read replicas for queries
   - Partition large tables
   - Consider TimescaleDB for health_checks table

2. **Redis**
   - Use Redis Cluster for high availability
   - Implement Redis Sentinel for failover

## Monitoring

### Health Checks

```bash
# API Gateway
curl http://localhost:8080/health

# Check all services
docker-compose ps
```

### Logs

```bash
# Docker logs
docker-compose logs -f api-gateway
docker-compose logs -f checker
docker-compose logs -f notification

# Service-specific logs
tail -f /var/log/monitoring/*.log
```

### Metrics

Consider integrating:
- Prometheus for metrics collection
- Grafana for visualization
- AlertManager for alerting

### Backup Strategy

1. **Database Backups**
```bash
# Automated daily backup
pg_dump monitoring_system | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20231024.sql.gz | psql monitoring_system
```

2. **Configuration Backups**
   - Backup .env files
   - Backup notification channel configurations
   - Version control all configuration

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check logs: `docker-compose logs <service-name>`
   - Verify environment variables
   - Check database connectivity

2. **WebSocket not connecting**
   - Verify token is valid
   - Check firewall rules
   - Ensure proxy supports WebSocket upgrade

3. **Notifications not sending**
   - Verify SMTP credentials
   - Check notification service logs
   - Test SMTP connection manually

4. **High memory usage**
   - Adjust connection pool sizes
   - Review query performance
   - Monitor Redis memory usage

## Support

For issues and questions:
- Check logs first
- Review this documentation
- Open an issue on GitHub
