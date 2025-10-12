# Batch-Based Quiz System - Complete Guide

## Overview
Students are now assigned to batches during registration, and they can only see quiz sessions that are scheduled for their specific batch. This ensures proper quiz distribution across different student groups.

## How It Works

### 1. Student Registration with Batch
When students register, they can optionally enter their batch name:
- **Batch Field**: Optional text field (e.g., "Batch A", "Morning Group", "Section 1")
- **Purpose**: Links student to specific quiz sessions
- **Flexibility**: Students without a batch won't see any sessions (only regular quizzes)

### 2. Admin Creates Quiz Sessions
Admins create quiz sessions with specific batch names:
1. Create a quiz (once)
2. Add multiple sessions with different batches and times
3. Each session has:
   - **Batch Name**: Must match student's batch exactly
   - **Start Time**: When this batch can access the quiz
   - **End Time**: When access expires for this batch

### 3. Student Sees Only Their Batch's Quizzes
- Students see only sessions where `session.batch_name == user.batch`
- Sessions are filtered automatically by the backend
- Students in different batches see different quizzes at different times

## Complete Workflow Example

### Admin Side:

**Step 1: Create Quiz**
```
Quiz: "Mathematics Final Exam"
- 20 questions
- 60 minutes total time
- 3 minutes per question
- Status: Published
```

**Step 2: Add Sessions for Different Batches**
```
Session 1:
- Batch Name: "Batch A"
- Start: Oct 15, 2025 10:00 AM
- End: Oct 15, 2025 10:30 AM

Session 2:
- Batch Name: "Batch B"
- Start: Oct 15, 2025 12:00 PM
- End: Oct 15, 2025 12:30 PM

Session 3:
- Batch Name: "Batch C"
- Start: Oct 15, 2025 2:00 PM
- End: Oct 15, 2025 2:30 PM
```

### Student Side:

**Student 1 (Batch A):**
```
Registration:
- Student ID: STU001
- Name: John Doe
- Email: john@example.com
- Batch: "Batch A"  ← Important!
- Password: ******

Dashboard (at 10:15 AM):
✅ Sees: "Mathematics Final Exam - Batch A" (Active)
❌ Doesn't see: Batch B or Batch C sessions
```

**Student 2 (Batch B):**
```
Registration:
- Student ID: STU002
- Name: Jane Smith
- Email: jane@example.com
- Batch: "Batch B"  ← Important!
- Password: ******

Dashboard (at 10:15 AM):
❌ Doesn't see: Batch A session (not their batch)
⏰ Sees: "Mathematics Final Exam - Batch B" (Upcoming, starts at 12 PM)

Dashboard (at 12:10 PM):
✅ Sees: "Mathematics Final Exam - Batch B" (Active)
```

**Student 3 (No Batch):**
```
Registration:
- Student ID: STU003
- Name: Bob Wilson
- Email: bob@example.com
- Batch: (left empty)
- Password: ******

Dashboard:
❌ Doesn't see: Any sessions (no batch assigned)
✅ Sees: Regular quizzes without sessions (if any)
```

## Database Changes

### Users Table
```sql
ALTER TABLE users ADD COLUMN batch VARCHAR(100);
```

**Fields:**
- `batch`: Optional string field for student's batch name
- Nullable (for backward compatibility)
- Only used for students (admins don't need batch)

### Quiz Sessions Table
```sql
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id),
    batch_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Quiz Attempts Table
```sql
ALTER TABLE quiz_attempts ADD COLUMN session_id UUID REFERENCES quiz_sessions(id);
```

## API Endpoints

### Student Registration (Modified)
```http
POST /api/auth/register
Content-Type: application/json

{
  "student_id": "STU001",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "batch": "Batch A"  // Optional
}
```

### Get Sessions for Subject (Filtered by Batch)
```http
GET /api/subjects/{subjectId}/sessions
Authorization: Bearer <token>

Response:
[
  {
    "id": "session-uuid",
    "quiz_id": "quiz-uuid",
    "batch_name": "Batch A",
    "start_time": "2025-10-15T10:00:00Z",
    "end_time": "2025-10-15T10:30:00Z",
    "is_active": true,
    "quiz": { ... }
  }
]
// Only returns sessions matching user's batch
```

## Frontend Components

### Registration Form (`Register.tsx`)
- Added **Batch** input field (optional)
- Help text: "Enter your batch name to see quizzes assigned to your batch"
- Passed to backend during registration

### Quiz List (`QuizList.tsx`)
- **Priority 1**: Shows sessions if available (filtered by user's batch)
- **Priority 2**: Shows regular quizzes if no sessions
- **Session Card**: Displays batch name with Users icon
- **Time Display**: Shows session-specific start/end times

### Edit Quiz (`EditQuiz.tsx`)
- **Sessions Section**: Create/manage quiz sessions
- **Batch Name Input**: Admin enters batch name for each session
- **Status Badges**: Active/Upcoming/Ended indicators

## Key Features

### ✅ Batch Isolation
- Students only see their batch's sessions
- No cross-batch visibility
- Prevents confusion and cheating

### ✅ Flexible Scheduling
- Same quiz, multiple time slots
- Each batch has independent access window
- Easy to reschedule per batch

### ✅ Optional System
- Batch field is optional during registration
- Quizzes without sessions work normally
- Backward compatible with existing data

### ✅ Admin Control
- Create unlimited sessions per quiz
- Assign specific batches to each session
- Activate/deactivate sessions anytime

## Testing Checklist

### Backend:
- [x] User model has `batch` field
- [x] Registration accepts batch parameter
- [x] Sessions filtered by user's batch
- [x] Database migration successful

### Frontend:
- [x] Registration form has batch input
- [x] Batch saved to user profile
- [x] Quiz list shows only user's batch sessions
- [x] Session cards display batch name
- [x] Admin can create sessions with batch names

### Integration:
- [ ] Register student with batch
- [ ] Admin creates quiz with sessions
- [ ] Student sees only their batch's session
- [ ] Different batches see different sessions
- [ ] Session times enforced correctly

## Common Issues & Solutions

### Issue 1: Student doesn't see any quizzes
**Cause**: Batch name mismatch
**Solution**: Ensure student's batch exactly matches session's batch_name (case-sensitive)

### Issue 2: All students see all sessions
**Cause**: Backend filtering not working
**Solution**: Check that session handler filters by user.Batch

### Issue 3: Student sees sessions for wrong batch
**Cause**: User's batch field not set correctly
**Solution**: Check user registration and database value

## Best Practices

### For Admins:
1. **Consistent Naming**: Use standard batch names (e.g., "Batch A", "Batch B")
2. **Clear Communication**: Tell students their exact batch name
3. **Time Buffers**: Add 5-10 minute buffers between sessions
4. **Test First**: Create test session before real exam

### For Students:
1. **Exact Match**: Enter batch name exactly as told by admin
2. **Case Sensitive**: "Batch A" ≠ "batch a" ≠ "BATCH A"
3. **Check Dashboard**: Verify you see your batch's quizzes
4. **Contact Admin**: If no quizzes visible, verify batch name

## Migration Guide

### For Existing Users:
```sql
-- Existing users will have NULL batch
-- They won't see any sessions (only regular quizzes)
-- To assign batch to existing user:
UPDATE users SET batch = 'Batch A' WHERE student_id = 'STU001';
```

### For Existing Quizzes:
```sql
-- Existing quizzes work normally
-- No sessions = students see regular quiz list
-- Add sessions to enable batch-based access
```

## Security Considerations

1. **Batch Verification**: Backend validates batch names
2. **Session Isolation**: Students can't access other batches' sessions
3. **Time Enforcement**: Sessions strictly enforce start/end times
4. **No Bypass**: Frontend and backend both check batch membership

## Future Enhancements

- [ ] Batch management UI for admins
- [ ] Bulk batch assignment (CSV upload)
- [ ] Batch-wise analytics and reports
- [ ] Auto-assign batches based on student ID pattern
- [ ] Batch groups (e.g., "Morning Batches" includes A, B, C)
