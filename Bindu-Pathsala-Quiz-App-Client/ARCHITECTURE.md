# বিন্দু পাঠশালা - System Architecture

## Overview

A full-stack web application for hosting and managing online quizzes with role-based access control, real-time timers, and comprehensive quiz management features.

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Web Framework**: Gorilla Mux (routing), Chi Router
- **Database**: PostgreSQL 15+
- **ORM**: GORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Migration Tool**: golang-migrate

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React Context API + Custom Hooks
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite

### Infrastructure
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (production)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│  (React + TypeScript + TailwindCSS)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Student    │  │    Admin     │  │     Auth     │       │
│  │  Dashboard   │  │  Dashboard   │  │    Pages     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                      │
│                  (Go HTTP Server + Router)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     Auth     │  │     CORS     │  │   Request    │       │
│  │  Middleware  │  │  Middleware  │  │   Logging    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Handler Layer                         │
│              (HTTP Request/Response Handlers)               │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  Auth  │ │Subject │ │  Quiz  │ │Question│ │Attempt │     │
│  │Handler │ │Handler │ │Handler │ │Handler │ │Handler │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│                    (Business Logic)                         │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  Auth  │ │Subject │ │  Quiz  │ │Question│ │Attempt │     │
│  │Service │ │Service │ │Service │ │Service │ │Service │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
│                  (Data Access Layer)                        │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  User  │ │Subject │ │  Quiz  │ │Question│ │Attempt │     │
│  │  Repo  │ │  Repo  │ │  Repo  │ │  Repo  │ │  Repo  │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                          │
│                    PostgreSQL 15+                           │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  users   │ │ subjects │ │  quizzes │ │questions │        │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤        │
│  │ options  │ │ attempts │ │ answers  │ │  ...     │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
1. User submits credentials → Auth Handler
2. Handler validates → Auth Service
3. Service queries database → User Repository
4. Password verified (bcrypt) → JWT token generated
5. Token returned to client
6. Client stores token (localStorage/sessionStorage)
7. Subsequent requests include JWT in Authorization header

### Quiz Taking Flow
1. Student selects quiz → GET /api/quizzes/:id
2. Validates quiz availability (time window, status)
3. Creates quiz attempt → POST /api/quizzes/:id/attempts
4. Fetches questions (randomized if configured)
5. Client displays questions with timer
6. Student submits answers → POST /api/attempts/:id/answer
7. Final submission → POST /api/attempts/:id/submit
8. System calculates score and stores results

## Database Schema

### Core Tables

**users**
- id (UUID, PK)
- student_id (VARCHAR, UNIQUE)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- role (ENUM: admin, student)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**subjects**
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**quizzes**
- id (UUID, PK)
- subject_id (UUID, FK)
- title (VARCHAR)
- description (TEXT)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- total_questions (INT)
- time_per_question (INT, seconds)
- allowed_time (INT, seconds)
- randomize_order (BOOLEAN)
- status (ENUM: draft, published, closed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**questions**
- id (UUID, PK)
- quiz_id (UUID, FK)
- text (TEXT)
- time_limit (INT, optional override)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**options**
- id (UUID, PK)
- question_id (UUID, FK)
- text (TEXT)
- is_correct (BOOLEAN)
- created_at (TIMESTAMP)

**quiz_attempts**
- id (UUID, PK)
- quiz_id (UUID, FK)
- user_id (UUID, FK)
- started_at (TIMESTAMP)
- finished_at (TIMESTAMP)
- score (DECIMAL)
- status (ENUM: in_progress, submitted, graded)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**answers**
- id (UUID, PK)
- quiz_attempt_id (UUID, FK)
- question_id (UUID, FK)
- selected_option_id (UUID, FK)
- time_taken (INT, seconds)
- created_at (TIMESTAMP)

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Password Security**: bcrypt hashing with salt
3. **Authorization**: Role-based access control (RBAC)
4. **Input Validation**: Server-side validation for all inputs
5. **SQL Injection Prevention**: Parameterized queries via GORM
6. **CORS**: Configured for specific origins
7. **Rate Limiting**: API rate limiting (optional)
8. **HTTPS**: TLS/SSL in production

## API Design

### Authentication
- POST /api/auth/register - Register new student
- POST /api/auth/login - Login (returns JWT)
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user info

### Subjects (Public/Student)
- GET /api/subjects - List all subjects
- GET /api/subjects/:id - Get subject details

### Subjects (Admin)
- POST /api/admin/subjects - Create subject
- PUT /api/admin/subjects/:id - Update subject
- DELETE /api/admin/subjects/:id - Delete subject

### Quizzes (Student)
- GET /api/subjects/:id/quizzes - List quizzes for subject
- GET /api/quizzes/:id - Get quiz details
- POST /api/quizzes/:id/attempts - Start quiz attempt
- GET /api/quizzes/:id/questions - Get quiz questions (for active attempt)

### Quizzes (Admin)
- POST /api/admin/subjects/:id/quizzes - Create quiz
- PUT /api/admin/quizzes/:id - Update quiz
- DELETE /api/admin/quizzes/:id - Delete quiz
- POST /api/admin/quizzes/:id/questions - Add question
- PUT /api/admin/questions/:id - Update question
- DELETE /api/admin/questions/:id - Delete question

### Quiz Attempts (Student)
- GET /api/attempts/:id - Get attempt details
- POST /api/attempts/:id/answer - Submit answer for question
- POST /api/attempts/:id/submit - Final submit attempt
- GET /api/attempts/:id/result - Get attempt result/review

### Quiz Attempts (Admin)
- GET /api/admin/attempts - List all attempts (with filters)
- GET /api/admin/quizzes/:id/attempts - Get attempts for quiz
- GET /api/admin/attempts/export - Export results (CSV)

## Frontend Architecture

### Pages
1. **Public Pages**
   - Login
   - Register

2. **Student Pages**
   - Dashboard (list subjects)
   - Subject Quizzes (list quizzes for subject)
   - Quiz Taking (active quiz interface)
   - Quiz Result (review and score)
   - Quiz History (past attempts)

3. **Admin Pages**
   - Dashboard (overview statistics)
   - Subjects Management
   - Quiz Management
   - Question Management
   - Results & Analytics
   - Student Management

### Components Structure
```
src/
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components (Header, Sidebar)
│   ├── admin/            # Admin-specific components
│   ├── student/          # Student-specific components
│   └── common/           # Shared components
├── pages/                # Page components
├── contexts/             # React contexts (Auth, Quiz)
├── hooks/                # Custom hooks
├── services/             # API services
├── types/                # TypeScript types/interfaces
├── utils/                # Utility functions
└── lib/                  # Third-party library configs
```

## Deployment Strategy

### Development
```bash
docker-compose up -d        # Start PostgreSQL
cd backend && go run main.go  # Start backend
cd frontend && npm run dev    # Start frontend
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Scalability Considerations

1. **Database**:
   - Indexed columns for fast queries
   - Connection pooling
   - Read replicas for analytics queries

2. **Backend**:
   - Stateless design (JWT auth)
   - Horizontal scaling possible
   - Caching layer (Redis) for frequently accessed data

3. **Frontend**:
   - Code splitting
   - Lazy loading
   - CDN for static assets

## Testing Strategy

### Backend
- Unit tests for services
- Integration tests for handlers
- Database tests with test containers

### Frontend
- Component tests (React Testing Library)
- E2E tests (Playwright/Cypress)
- Unit tests for utilities

## Future Enhancements

1. Real-time features (WebSocket for live monitoring)
2. Advanced analytics and reporting
3. Question bank and random selection
4. Multiple question types (essay, fill-in-blank)
5. Automated grading for text answers (AI)
6. Multi-language support
7. Mobile app (React Native)
8. Integration with LMS platforms
