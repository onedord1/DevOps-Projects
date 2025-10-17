# বিন্দু পাঠশালা - Getting Started

A quick guide to get the বিন্দু পাঠশালা running in minutes.

## Prerequisites

Choose one of the following setup options:

### Option 1: Docker (Recommended)
- Docker 20.10+
- Docker Compose 2.0+

### Option 2: Local Development
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+

## Quick Start with Docker (Recommended)

### 1. Start the Application

```bash
# Navigate to project directory
cd quiz-hosting-app

# Start all services
docker-compose up -d
```

This command will:
- Start PostgreSQL database
- Build and start the Go backend
- Build and start the React frontend
- Apply database migrations
- Seed initial data

### 2. Access the Application

Open your browser and visit:
```
http://localhost
```

### 3. Login with Demo Accounts

**Admin Account:**
- Student ID: `ADMIN001`
- Password: `admin123`

**Student Accounts:**
- Student ID: `STU001` - `STU005`
- Password: `student123`

### 4. Explore the Application

**As a Student:**
1. Browse available subjects
2. Select a subject to view quizzes
3. Start a quiz and answer questions
4. Submit and view your results
5. Check your quiz history

**As an Admin:**
1. View dashboard with statistics
2. Create new subjects
3. Create quizzes with questions
4. View all student attempts and results
5. Manage quiz availability

### 5. Stop the Application

```bash
docker-compose down
```

## Local Development Setup

### Backend Setup

1. **Start PostgreSQL**
```bash
docker run --name quiz-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=quiz_hosting \
  -p 5432:5432 \
  -d postgres:15-alpine
```

2. **Configure Backend**
```bash
cd backend
cp .env.example .env
# Edit .env if needed
```

3. **Install Dependencies**
```bash
go mod download
```

4. **Run Migrations**
```bash
# Migrations will run automatically on first start
# Or use golang-migrate CLI if you have it installed
```

5. **Start Backend Server**
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Using Makefile Commands

We provide convenient Makefile commands:

```bash
# Show all available commands
make help

# Start development environment (DB only)
make dev

# Start all services with Docker
make up

# Stop all services
make down

# View logs
make logs

# Run tests
make test

# Clean up (remove volumes)
make clean
```

## Project Structure Overview

```
quiz-hosting-app/
├── backend/              # Go backend
│   ├── handlers/         # HTTP handlers
│   ├── models/           # Database models
│   ├── middleware/       # Authentication & logging
│   └── migrations/       # Database migrations
├── frontend/             # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── services/    # API services
└── docker-compose.yml   # Docker configuration
```

## Common Tasks

### Create a New Admin User

```bash
# Connect to database
docker exec -it quiz-db psql -U postgres quiz_hosting

# Create admin (password: admin123)
INSERT INTO users (student_id, name, email, password_hash, role)
VALUES ('ADMIN002', 'New Admin', 'admin2@quiz.com',
        '$2a$10$8K1p/a0dL3.I/pYYXqG4qOX9QYVqKYOYV5ZK5wKZ7h9YqO1xN.Wli', 'admin');
```

### Add a New Subject (via API)

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"ADMIN001","password":"admin123"}' \
  | jq -r '.data.token')

# Create subject
curl -X POST http://localhost:8080/api/admin/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chemistry",
    "description": "General chemistry concepts"
  }'
```

### Backup Database

```bash
# Using Makefile
make backup-db

# Manual
docker exec quiz-db pg_dump -U postgres quiz_hosting > backup.sql
```

### Restore Database

```bash
# Using Makefile
make restore-db file=backup.sql

# Manual
docker exec -i quiz-db psql -U postgres quiz_hosting < backup.sql
```

## Testing the Application

### Test Backend

```bash
cd backend
go test ./...
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "TEST001",
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU001",
    "password": "student123"
  }'
```

## Troubleshooting

### Port Already in Use

If you get a port conflict error:

```bash
# Check what's using the port
sudo lsof -i :8080  # Backend
sudo lsof -i :80    # Frontend
sudo lsof -i :5432  # Database

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Failed

```bash
# Check if database is running
docker ps | grep quiz-db

# View database logs
docker logs quiz-db

# Restart database
docker-compose restart db
```

### Frontend Build Errors

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Build Errors

```bash
# Clear Go cache and rebuild
cd backend
go clean -cache
go mod download
go run main.go
```

## Development Workflow

### Making Changes

1. **Backend Changes**
   - Edit files in `backend/`
   - Restart: `docker-compose restart backend`
   - Or use `go run main.go` for faster iteration

2. **Frontend Changes**
   - Edit files in `frontend/src/`
   - Vite will auto-reload
   - Or rebuild: `npm run build`

3. **Database Changes**
   - Create new migration in `backend/migrations/`
   - Restart backend to apply migrations

### Adding New Features

1. **New Backend Endpoint**
   - Add handler in `backend/handlers/`
   - Add route in `backend/routes/routes.go`
   - Update models if needed

2. **New Frontend Page**
   - Create page in `frontend/src/pages/`
   - Add route in `frontend/src/App.tsx`
   - Create necessary components

3. **New Database Table**
   - Create migration files
   - Add model in `backend/models/`
   - Update handlers and routes

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quiz_hosting

# Server
PORT=8080
ENV=development

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRY_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8080/api
```

## Next Steps

1. **Customize the Application**
   - Add your own subjects and quizzes
   - Customize the UI theme
   - Add additional features

2. **Deploy to Production**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guides
   - Configure production environment variables
   - Set up SSL/TLS

3. **Integrate with Your System**
   - Use the API endpoints to integrate
   - See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Resources

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guides

## Support

If you encounter issues:

1. Check the logs: `make logs`
2. Review documentation
3. Check GitHub issues
4. Create a new issue with details

## Demo Credentials Summary

| Role | Student ID | Password |
|------|-----------|----------|
| Admin | AD123456 | Admin123 |
| Student | STU001 | student123 |
| Student | STU002 | student123 |
| Student | STU003 | student123 |
| Student | STU004 | student123 |
| Student | STU005 | student123 |

## Happy Coding! 🚀

You're now ready to use and extend the Quiz Hosting Platform. Enjoy building your quiz system!
