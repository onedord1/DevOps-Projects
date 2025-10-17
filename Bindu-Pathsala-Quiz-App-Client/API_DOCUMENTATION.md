# বিন্দু পাঠশালা - API Documentation

Comprehensive API documentation for the বিন্দু পাঠশালা

**Base URL**
```
http://localhost:8080/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Authentication Endpoints

### Register Student

**POST** `/auth/register`

Register a new student account.

**Request Body:**
```json
{
  "student_id": "STU123",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "student_id": "STU123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "User registered successfully"
}
```

### Login

**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "student_id": "STU123",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "student_id": "STU123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Login successful"
}
```

### Get Current User

**GET** `/auth/me`

Get currently authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "student_id": "STU123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## Subject Endpoints

### Get All Subjects

**GET** `/subjects`

Retrieve all subjects with quiz count.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mathematics",
      "description": "Core mathematics concepts",
      "quiz_count": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Subject by ID

**GET** `/subjects/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "name": "Mathematics",
    "description": "Core mathematics concepts",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Subject (Admin Only)

**POST** `/admin/subjects`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Physics",
  "description": "Physics fundamentals"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "name": "Physics",
    "description": "Physics fundamentals",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Subject created successfully"
}
```

### Update Subject (Admin Only)

**PUT** `/admin/subjects/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Advanced Physics",
  "description": "Advanced physics topics"
}
```

**Response:** `200 OK`

### Delete Subject (Admin Only)

**DELETE** `/admin/subjects/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "message": "Subject deleted successfully"
}
```

## Quiz Endpoints

### Get Quizzes by Subject

**GET** `/subjects/:subjectId/quizzes`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "subject_id": "uuid",
      "title": "Algebra Basics",
      "description": "Test your algebra knowledge",
      "start_time": "2024-01-01T00:00:00Z",
      "end_time": "2024-12-31T23:59:59Z",
      "total_questions": 10,
      "time_per_question": 60,
      "allowed_time": 600,
      "randomize_order": true,
      "status": "published",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "subject": {
        "id": "uuid",
        "name": "Mathematics"
      }
    }
  ]
}
```

### Get Quiz by ID

**GET** `/quizzes/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Quiz Questions

**GET** `/quizzes/:id/questions`

Get all questions for a quiz. For students, correct answers are hidden.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "text": "What is 2 + 2?",
      "time_limit": null,
      "options": [
        {
          "id": "uuid",
          "text": "3"
        },
        {
          "id": "uuid",
          "text": "4"
        },
        {
          "id": "uuid",
          "text": "5"
        }
      ]
    }
  ]
}
```

### Create Quiz (Admin Only)

**POST** `/admin/quizzes`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "subject_id": "uuid",
  "title": "Calculus Quiz",
  "description": "Calculus fundamentals",
  "start_time": "2024-06-01T00:00:00Z",
  "end_time": "2024-12-31T23:59:59Z",
  "time_per_question": 120,
  "allowed_time": 1800,
  "randomize_order": true
}
```

**Response:** `201 Created`

### Update Quiz (Admin Only)

**PUT** `/admin/quizzes/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "published"
}
```

**Response:** `200 OK`

### Delete Quiz (Admin Only)

**DELETE** `/admin/quizzes/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

## Question Endpoints

### Create Question (Admin Only)

**POST** `/admin/questions`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "quiz_id": "uuid",
  "text": "What is the derivative of x^2?",
  "time_limit": 60,
  "options": [
    {
      "text": "x",
      "is_correct": false
    },
    {
      "text": "2x",
      "is_correct": true
    },
    {
      "text": "x^2",
      "is_correct": false
    },
    {
      "text": "2",
      "is_correct": false
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "quiz_id": "uuid",
    "text": "What is the derivative of x^2?",
    "time_limit": 60,
    "options": [
      {
        "id": "uuid",
        "question_id": "uuid",
        "text": "2x",
        "is_correct": true
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Question created successfully"
}
```

### Update Question (Admin Only)

**PUT** `/admin/questions/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "text": "Updated question text",
  "options": [
    {
      "text": "Option 1",
      "is_correct": true
    },
    {
      "text": "Option 2",
      "is_correct": false
    }
  ]
}
```

**Response:** `200 OK`

### Delete Question (Admin Only)

**DELETE** `/admin/questions/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

## Quiz Attempt Endpoints

### Start Quiz Attempt

**POST** `/quizzes/:id/attempts`

Start a new quiz attempt or resume existing one.

**Headers:** `Authorization: Bearer <token>`

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "quiz_id": "uuid",
    "user_id": "uuid",
    "started_at": "2024-01-01T10:00:00Z",
    "finished_at": null,
    "score": 0,
    "status": "in_progress",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  },
  "message": "Quiz attempt started successfully"
}
```

### Submit Answer

**POST** `/attempts/:id/answer`

Submit or update an answer for a question.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "question_id": "uuid",
  "selected_option_id": "uuid",
  "time_taken": 45
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "quiz_attempt_id": "uuid",
    "question_id": "uuid",
    "selected_option_id": "uuid",
    "time_taken": 45,
    "created_at": "2024-01-01T10:05:00Z"
  },
  "message": "Answer submitted successfully"
}
```

### Submit Quiz Attempt

**POST** `/attempts/:id/submit`

Finalize quiz attempt and calculate score.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "quiz_id": "uuid",
    "user_id": "uuid",
    "started_at": "2024-01-01T10:00:00Z",
    "finished_at": "2024-01-01T10:30:00Z",
    "score": 85.5,
    "status": "graded",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:30:00Z"
  },
  "message": "Quiz submitted successfully"
}
```

### Get Attempt Details

**GET** `/attempts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Get Attempt Result

**GET** `/attempts/:id/result`

Get detailed result with answers and correct answers.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "quiz_id": "uuid",
    "quiz_title": "Algebra Basics",
    "subject_name": "Mathematics",
    "student_name": "John Doe",
    "student_id": "STU123",
    "score": 85.5,
    "status": "graded",
    "started_at": "2024-01-01T10:00:00Z",
    "finished_at": "2024-01-01T10:30:00Z",
    "answers": [
      {
        "id": "uuid",
        "question_id": "uuid",
        "question_text": "What is 2 + 2?",
        "selected_option_text": "4",
        "is_correct": true,
        "correct_option_text": "4",
        "time_taken": 15
      }
    ]
  }
}
```

### Get My Attempts

**GET** `/my-attempts`

Get all quiz attempts for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "score": 85.5,
      "status": "graded",
      "started_at": "2024-01-01T10:00:00Z",
      "finished_at": "2024-01-01T10:30:00Z",
      "quiz": {
        "id": "uuid",
        "title": "Algebra Basics",
        "subject": {
          "name": "Mathematics"
        }
      }
    }
  ]
}
```

### Get All Attempts (Admin Only)

**GET** `/admin/attempts`

**Query Parameters:**
- `quiz_id` (optional): Filter by quiz ID

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "quiz_id": "uuid",
      "user_id": "uuid",
      "score": 85.5,
      "status": "graded",
      "started_at": "2024-01-01T10:00:00Z",
      "finished_at": "2024-01-01T10:30:00Z",
      "user": {
        "student_id": "STU123",
        "name": "John Doe"
      },
      "quiz": {
        "title": "Algebra Basics",
        "subject": {
          "name": "Mathematics"
        }
      }
    }
  ]
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## Rate Limiting

Currently not implemented, but recommended for production:
- 100 requests per minute per IP for authentication endpoints
- 1000 requests per minute per IP for other endpoints

## Pagination

Future enhancement: Add pagination for list endpoints

```
GET /api/subjects?page=1&limit=10
```

## Webhooks

Future enhancement: Webhook support for events like:
- Quiz published
- Student completed quiz
- New student registered

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Login
const { data } = await api.post('/auth/login', {
  student_id: 'STU123',
  password: 'password123',
});

// Set token for future requests
api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;

// Get subjects
const subjects = await api.get('/subjects');
```

### cURL

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"STU123","password":"password123"}'

# Use token in subsequent requests
TOKEN="your-jwt-token"

# Get subjects
curl -X GET http://localhost:8080/api/subjects \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Support

Future enhancement for real-time features:
- Live quiz monitoring for admins
- Real-time leaderboards
- Push notifications
