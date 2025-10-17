# বিন্দু পাঠশালা - Deployment Guide

This guide covers different deployment strategies for the Quiz Hosting Platform.

## Table of Contents

1. [Docker Compose Deployment](#docker-compose-deployment)
2. [Manual Deployment](#manual-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Security Checklist](#security-checklist)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Docker Compose Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM
- 10GB disk space

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd quiz-hosting-app
```

2. **Configure environment variables**

Edit `docker-compose.yml` and update:
- Database credentials
- JWT secret
- CORS origins

```yaml
environment:
  DB_PASSWORD: your-secure-password
  JWT_SECRET: your-super-secret-jwt-key-min-32-characters
  CORS_ALLOWED_ORIGINS: https://yourdomain.com
```

3. **Build and start services**
```bash
make prod-build
make prod-up
```

Or manually:
```bash
docker-compose build --no-cache
docker-compose up -d
```

4. **Verify deployment**
```bash
docker-compose ps
docker-compose logs
```

5. **Access the application**
- Frontend: http://your-server-ip
- Backend API: http://your-server-ip:8080

### SSL/TLS Setup

For production, use a reverse proxy like Nginx with Let's Encrypt:

1. **Install Certbot**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain SSL certificate**
```bash
sudo certbot --nginx -d yourdomain.com
```

3. **Update Nginx configuration** to proxy to your application

## Manual Deployment

### Backend Deployment

1. **Build the backend**
```bash
cd backend
go build -o quiz-api main.go
```

2. **Create systemd service** `/etc/systemd/system/quiz-api.service`
```ini
[Unit]
Description=Quiz Hosting API
After=network.target postgresql.service

[Service]
Type=simple
User=quiz
WorkingDirectory=/opt/quiz-hosting/backend
ExecStart=/opt/quiz-hosting/backend/quiz-api
Restart=always
RestartSec=10
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_USER=quiz_user"
Environment="DB_PASSWORD=your-password"
Environment="DB_NAME=quiz_hosting"
Environment="PORT=8080"
Environment="JWT_SECRET=your-secret"

[Install]
WantedBy=multi-user.target
```

3. **Start the service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable quiz-api
sudo systemctl start quiz-api
sudo systemctl status quiz-api
```

### Frontend Deployment

1. **Build the frontend**
```bash
cd frontend
npm install
npm run build
```

2. **Nginx configuration** `/etc/nginx/sites-available/quiz-hosting`
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/quiz-hosting;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

3. **Copy build files**
```bash
sudo mkdir -p /var/www/quiz-hosting
sudo cp -r dist/* /var/www/quiz-hosting/
sudo chown -R www-data:www-data /var/www/quiz-hosting
```

4. **Enable site and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/quiz-hosting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Database Setup

1. **Install PostgreSQL**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

2. **Create database and user**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE quiz_hosting;
CREATE USER quiz_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE quiz_hosting TO quiz_user;
\q
```

3. **Run migrations**
```bash
cd backend
# Use golang-migrate or your migration tool
migrate -path migrations -database "postgresql://quiz_user:password@localhost:5432/quiz_hosting?sslmode=disable" up
```

## Cloud Deployment

### AWS Deployment

#### Using EC2

1. **Launch EC2 instance** (t3.medium recommended)
   - Ubuntu 22.04 LTS
   - Configure security groups (ports 22, 80, 443)

2. **Connect and install Docker**
```bash
ssh ubuntu@your-ec2-ip
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker ubuntu
```

3. **Deploy application**
```bash
git clone <repository-url>
cd quiz-hosting-app
make prod-up
```

#### Using ECS (Elastic Container Service)

1. **Push images to ECR**
```bash
# Tag and push backend
docker tag quiz-backend:latest your-account.dkr.ecr.region.amazonaws.com/quiz-backend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/quiz-backend:latest

# Tag and push frontend
docker tag quiz-frontend:latest your-account.dkr.ecr.region.amazonaws.com/quiz-frontend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/quiz-frontend:latest
```

2. **Create ECS task definitions and services**
3. **Configure Application Load Balancer**
4. **Set up RDS for PostgreSQL database**

### Google Cloud Platform

1. **Use Cloud Run for containerized deployment**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/quiz-backend
gcloud run deploy quiz-backend --image gcr.io/PROJECT_ID/quiz-backend --platform managed
```

2. **Use Cloud SQL for PostgreSQL**

### DigitalOcean

1. **Create Droplet** (2GB RAM recommended)
2. **Install Docker and Docker Compose**
3. **Deploy using docker-compose**

### Heroku

1. **Backend deployment**
```bash
heroku create quiz-api
heroku addons:create heroku-postgresql:hobby-dev
git subtree push --prefix backend heroku main
```

2. **Frontend deployment**
```bash
heroku create quiz-frontend
heroku buildpacks:set heroku/nodejs
git subtree push --prefix frontend heroku main
```

## Security Checklist

### Pre-deployment

- [ ] Change default admin password
- [ ] Update JWT secret (minimum 32 characters)
- [ ] Use strong database passwords
- [ ] Configure CORS with specific origins
- [ ] Enable HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Disable unnecessary ports
- [ ] Update all dependencies

### Environment Variables

Never commit sensitive data. Use environment variables:

```bash
# Bad
JWT_SECRET=mysecret

# Good
JWT_SECRET=$(openssl rand -base64 32)
```

### Database Security

- [ ] Use separate database user with limited privileges
- [ ] Enable SSL for database connections
- [ ] Regular backups
- [ ] Keep PostgreSQL updated

### Application Security

- [ ] Rate limiting on API endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (using ORM)
- [ ] XSS protection
- [ ] CSRF protection for forms
- [ ] Secure headers (using helmet in production)

## Monitoring and Maintenance

### Logging

1. **Backend logs**
```bash
# Docker
docker logs -f quiz-backend

# Systemd
sudo journalctl -u quiz-api -f
```

2. **Database logs**
```bash
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Monitoring

1. **System metrics**
```bash
# CPU, Memory, Disk
htop
df -h
```

2. **Application metrics**
- Response times
- Error rates
- Active users
- Database connections

### Backup Strategy

1. **Automated database backups**
```bash
# Create backup script
cat > /opt/backup-quiz-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/quiz-hosting"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker exec quiz-db pg_dump -U postgres quiz_hosting > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-quiz-db.sh
```

2. **Add to cron**
```bash
crontab -e
# Add: 0 2 * * * /opt/backup-quiz-db.sh
```

### Updates and Upgrades

1. **Backend updates**
```bash
cd backend
git pull
go build -o quiz-api main.go
sudo systemctl restart quiz-api
```

2. **Frontend updates**
```bash
cd frontend
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/quiz-hosting/
```

3. **Docker updates**
```bash
git pull
make prod-build
make down
make prod-up
```

### Health Checks

Add health check endpoint monitoring:

```bash
# Create health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "$(date): API is healthy"
else
    echo "$(date): API is down! Restarting..."
    docker-compose restart backend
fi
EOF

chmod +x /opt/health-check.sh

# Add to cron (every 5 minutes)
*/5 * * * * /opt/health-check.sh >> /var/log/quiz-health.log 2>&1
```

## Scaling Considerations

### Horizontal Scaling

1. **Load balancer** (Nginx, HAProxy, or cloud provider)
2. **Multiple backend instances**
3. **Shared database** (separate server)
4. **Session storage** (Redis for distributed sessions if needed)

### Database Scaling

1. **Read replicas** for heavy read operations
2. **Connection pooling**
3. **Query optimization and indexing**
4. **Database caching** (Redis)

### Performance Optimization

1. **CDN** for frontend static assets
2. **API response caching**
3. **Database query optimization**
4. **Gzip compression**
5. **Image optimization**

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check database is running
   - Verify credentials
   - Check network connectivity

2. **CORS errors**
   - Verify CORS_ALLOWED_ORIGINS includes frontend URL
   - Check protocol (http vs https)

3. **JWT token errors**
   - Verify JWT_SECRET is consistent
   - Check token expiry time

4. **Migration errors**
   - Run migrations manually
   - Check database user permissions

## Support and Maintenance

For production deployments:
- Monitor logs regularly
- Set up alerting for errors
- Keep dependencies updated
- Regular security audits
- Database performance monitoring
- Backup verification

## Rollback Procedure

If deployment fails:

1. **Docker deployment**
```bash
docker-compose down
git checkout <previous-commit>
make prod-up
```

2. **Manual deployment**
```bash
# Restore database
make restore-db file=backup_YYYYMMDD_HHMMSS.sql

# Restart services
sudo systemctl restart quiz-api
sudo systemctl restart nginx
```

3. **Verify rollback**
```bash
make status
curl http://localhost:8080/health
```
