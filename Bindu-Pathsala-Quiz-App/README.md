# বিন্দু পাঠশালা - Educational Quiz Platform

A comprehensive full-stack web application for hosting and managing online quizzes with role-based access control, real-time timers, and detailed analytics.

## Features

### For Students
- 🎓 **User Registration & Authentication** - Secure login with JWT tokens
- 📚 **Browse Subjects** - View available subjects and their quizzes
- ⏰ **Timed Quizzes** - Take quizzes with per-question or overall time limits
- 🔀 **Question Randomization** - Questions can be randomized for each attempt
- 📊 **Instant Results** - View scores and detailed feedback immediately after submission
- 📈 **Performance Tracking** - Track quiz history and performance over time
- 🔍 **Answer Review** - Review correct and incorrect answers after submission

### For Admins
- 👥 **User Management** - Manage student accounts
- 📖 **Subject Management** - Create, update, and delete subjects
- 📝 **Quiz Management** - Create quizzes with flexible configurations
- ❓ **Question Builder** - Add multiple-choice questions with correct answers
- ⚙️ **Quiz Configuration** - Set time limits, randomization, and availability windows
- 📊 **Analytics Dashboard** - View comprehensive statistics and student performance
- 📥 **Results Export** - Export quiz results for analysis

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gorilla Mux
- **Database**: PostgreSQL 15
- **ORM**: GORM
- **Authentication**: JWT
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (production)
- **Database**: PostgreSQL 15

## Project Structure

```
quiz-hosting-app/
├── backend/
│   ├── config/           # Configuration management
│   ├── database/         # Database initialization
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # Authentication & logging middleware
│   ├── migrations/       # Database migrations
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── main.go          # Application entry point
│   ├── go.mod           # Go dependencies
│   └── Dockerfile       # Backend Docker configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Main App component
│   │   └── main.tsx     # Entry point
│   ├── package.json     # Frontend dependencies
│   ├── Dockerfile       # Frontend Docker configuration
│   └── nginx.conf       # Nginx configuration
│
├── docker-compose.yml   # Docker Compose configuration
├── ARCHITECTURE.md      # System architecture documentation
└── README.md           # This file
```

## Prerequisites

- Docker and Docker Compose (recommended)
- **OR** for local development:
  - Go 1.21 or higher
  - Node.js 18 or higher
  - PostgreSQL 15 or higher

## Quick Start with Docker

### 1. Clone the repository
```bash
git clone <repository-url>
cd quiz-hosting-app
```

### 2. Start all services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 8080
- Frontend application on port 80

### 3. Access the application
Open your browser and navigate to:
```
http://localhost
```

### 4. Login with demo credentials

**Admin Account:**
- Student ID: `ADMIN001`
- Password: `admin123`

**Student Account:**
- Student ID: `STU001`
- Password: `student123`

### 5. Stop all services
```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

## Local Development Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Copy environment file**
```bash
cp .env.example .env
```

3. **Update environment variables** in `.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quiz_hosting
DB_SSL_MODE=disable
PORT=8080
ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRY_HOURS=24
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

4. **Install dependencies**
```bash
go mod download
```

5. **Setup PostgreSQL database**
```bash
# Using Docker
docker run --name quiz-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quiz_hosting -p 5432:5432 -d postgres:15-alpine

# OR install PostgreSQL locally and create database
createdb quiz_hosting
```

6. **Run migrations**
```bash
# Using golang-migrate CLI
migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/quiz_hosting?sslmode=disable" up

# OR the migrations will run automatically when you start the application
```

7. **Run the backend**
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Copy environment file**
```bash
cp .env.example .env
```

4. **Run development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Testing Backend Endpoints

You can test the API using curl or any HTTP client:

```bash
# Register a new student
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU999",
    "name": "Test Student",
    "email": "test@student.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU001",
    "password": "student123"
  }'

# Get subjects (requires authentication)
curl -X GET http://localhost:8080/api/subjects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new student | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Subject Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/subjects` | Get all subjects | Yes | No |
| GET | `/api/subjects/:id` | Get subject by ID | Yes | No |
| POST | `/api/admin/subjects` | Create subject | Yes | Yes |
| PUT | `/api/admin/subjects/:id` | Update subject | Yes | Yes |
| DELETE | `/api/admin/subjects/:id` | Delete subject | Yes | Yes |

### Quiz Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/subjects/:id/quizzes` | Get quizzes by subject | Yes | No |
| GET | `/api/quizzes/:id` | Get quiz by ID | Yes | No |
| GET | `/api/quizzes/:id/questions` | Get quiz questions | Yes | No |
| POST | `/api/admin/quizzes` | Create quiz | Yes | Yes |
| PUT | `/api/admin/quizzes/:id` | Update quiz | Yes | Yes |
| DELETE | `/api/admin/quizzes/:id` | Delete quiz | Yes | Yes |

### Question Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/admin/questions` | Create question | Yes | Yes |
| GET | `/api/admin/questions/:id` | Get question | Yes | Yes |
| PUT | `/api/admin/questions/:id` | Update question | Yes | Yes |
| DELETE | `/api/admin/questions/:id` | Delete question | Yes | Yes |

### Quiz Attempt Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/quizzes/:id/attempts` | Start quiz attempt | Yes |
| POST | `/api/attempts/:id/answer` | Submit answer | Yes |
| POST | `/api/attempts/:id/submit` | Submit quiz | Yes |
| GET | `/api/attempts/:id` | Get attempt details | Yes |
| GET | `/api/attempts/:id/result` | Get attempt result | Yes |
| GET | `/api/my-attempts` | Get user's attempts | Yes |
| GET | `/api/admin/attempts` | Get all attempts (admin) | Yes (Admin) |

## Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed database schema and relationships.

Key tables:
- `users` - Student and admin accounts
- `subjects` - Subject categories
- `quizzes` - Quiz metadata and configuration
- `questions` - Quiz questions
- `options` - Multiple choice options
- `quiz_attempts` - Student quiz attempts
- `answers` - Student answers for each question

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `quiz_hosting` |
| `DB_SSL_MODE` | SSL mode | `disable` |
| `PORT` | Server port | `8080` |
| `ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRY_HOURS` | Token expiry time | `24` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | Required |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080/api` |

## Production Deployment

### Using Docker Compose

1. **Update environment variables** in `docker-compose.yml`
   - Change database passwords
   - Update JWT secret
   - Configure CORS origins

2. **Build and start services**
```bash
docker-compose up -d --build
```

3. **Check logs**
```bash
docker-compose logs -f
```

### Manual Deployment

#### Backend
```bash
cd backend
go build -o quiz-api
./quiz-api
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ directory with Nginx or any static file server
```

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiry
2. **Password Security**: bcrypt hashing with salt
3. **Authorization**: Role-based access control (RBAC)
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Prevention**: Parameterized queries via GORM
6. **CORS**: Configured for specific origins
7. **HTTPS**: Use TLS/SSL in production

**Important**: Change default passwords and JWT secret in production!

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs quiz-db

# Connect to PostgreSQL
docker exec -it quiz-db psql -U postgres -d quiz_hosting
```

### Backend Issues
```bash
# Check backend logs
docker logs quiz-backend

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```bash
# Check frontend logs
docker logs quiz-frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Email notifications for new quizzes
- [ ] Real-time quiz monitoring dashboard
- [ ] Multiple question types (essay, fill-in-blank)
- [ ] Question bank with random selection
- [ ] Quiz retake policies
- [ ] Leaderboards
- [ ] Export results to CSV/Excel
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with LMS platforms

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Credits

Built with ❤️ using Go, React, PostgreSQL, and modern web technologies.
