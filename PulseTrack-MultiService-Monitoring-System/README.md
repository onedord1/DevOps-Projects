# Multi-Service Monitoring System

A production-ready, distributed monitoring system built with Rust microservices and Next.js 15.5 frontend.

## Architecture

### Backend (Rust Microservices)
- **API Gateway** - REST API and WebSocket server for frontend
- **Org Config Service** - Organization and endpoint management
- **Checker Service** - Health checking and status monitoring
- **Notification Service** - Alert delivery via email/webhooks
- **Shared Libraries** - Common models, utilities, and database access

### Frontend (Next.js 15.5)
- Real-time dashboard with WebSocket updates
- Organization management
- Service endpoint configuration
- Status history and analytics
- Modern UI with TailwindCSS and shadcn/ui

## Features

### Backend
- ✅ Multi-tenancy with organization isolation
- ✅ Configurable health checks (HTTP/HTTPS endpoints)
- ✅ Smart alerting with configurable thresholds
- ✅ Multiple notification channels (Email, Slack, Discord, MS Teams)
- ✅ Detailed failure reason tracking
- ✅ Historical data with time-series support
- ✅ WebSocket for real-time updates
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Structured logging and tracing
- ✅ Horizontal scalability
- ✅ API versioning

### Frontend
- ✅ Real-time status dashboard
- ✅ Service cards with visual status indicators
- ✅ Filtering and grouping
- ✅ Detailed history views with charts
- ✅ Notification configuration UI
- ✅ Dark/Light theme
- ✅ Responsive design
- ✅ Server and Client components (Next.js 15.5)

## Tech Stack

### Backend
- Rust 1.90.0
- Tokio (async runtime)
- Axum (web framework)
- SQLx (database)
- PostgreSQL / TimescaleDB
- Redis (pub/sub for events)
- Reqwest (HTTP client)
- Lettre (email)
- Tower (middleware)
- Tracing (observability)

### Frontend
- Next.js 15.5
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Recharts (charts)
- WebSocket client
- React Query

## Getting Started

### Prerequisites
- Rust 1.90.0+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repo-url>
cd service-monitoring-system

# Start all services
docker-compose up -d

# Access the frontend
open http://localhost:3000
```

### Manual Setup

#### Backend

```bash
cd backend

# Setup database
createdb monitoring_system
psql monitoring_system < migrations/init.sql

# Run services (in separate terminals)
cd services/api-gateway && cargo run
cd services/org-config && cargo run
cd services/checker && cargo run
cd services/notification && cargo run
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost/monitoring_system
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8080/docs
- OpenAPI spec: http://localhost:8080/api/v1/openapi.json

## Testing

### Backend
```bash
cd backend
cargo test --all
```

### Frontend
```bash
cd frontend
npm test
npm run test:e2e
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

## License

MIT
