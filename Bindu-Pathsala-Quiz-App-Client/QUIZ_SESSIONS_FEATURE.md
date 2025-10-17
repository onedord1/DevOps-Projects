# Quiz Sessions/Batches Feature

## Overview
This feature allows admins to relaunch the same quiz multiple times for different batches or groups at different time slots. This is perfect for scenarios where you have multiple batches of students taking the same quiz at different times.

## Use Case Example
**Scenario**: You have a "Mathematics Final Exam" quiz and 7 different batches:
- **Batch A**: 10:00 AM - 10:30 AM
- **Batch B**: 12:00 PM - 12:30 PM  
- **Batch C**: 2:00 PM - 2:30 PM
- **Batch D**: 4:00 PM - 4:30 PM
- ...and so on

Instead of creating 7 separate quizzes, you create ONE quiz and add 7 different sessions with different time slots.

## How It Works

### For Admins:

1. **Create a Quiz** (one time):
   - Go to Admin → Manage Subjects → Select Subject → Create Quiz
   - Add questions to the quiz
   - Publish the quiz

2. **Add Sessions/Batches**:
   - In the quiz edit page, scroll to "Quiz Sessions / Batches" section
   - Click "Add Session"
   - Enter:
     - **Batch Name**: e.g., "Batch A", "Morning Group", "Section 1"
     - **Start Time**: When this batch can start the quiz
     - **End Time**: When this batch's quiz expires
   - Click "Create Session"
   - Repeat for all batches

3. **Manage Sessions**:
   - View all sessions with status (Active Now, Upcoming, Ended)
   - Delete sessions if needed
   - Sessions are color-coded:
     - 🟢 **Green**: Currently active
     - 🔵 **Blue**: Upcoming
     - ⚫ **Gray**: Ended

### For Students:

1. **View Available Quizzes**:
   - Students see only the sessions that are currently active (within the time window)
   - If a quiz has sessions, students see the session-specific time window
   - They can only start the quiz during their batch's time

2. **Take Quiz**:
   - Students take the quiz normally with all timers and features
   - Their attempt is linked to the specific session/batch

## Database Schema

### New Table: `quiz_sessions`
```sql
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    batch_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Table: `quiz_attempts`
```sql
ALTER TABLE quiz_attempts 
ADD COLUMN session_id UUID REFERENCES quiz_sessions(id);
```

## API Endpoints

### Admin Endpoints:
- `POST /api/admin/quizzes/{quizId}/sessions` - Create session
- `GET /api/admin/quizzes/{quizId}/sessions` - Get all sessions for a quiz
- `GET /api/admin/sessions/{id}` - Get specific session
- `PUT /api/admin/sessions/{id}` - Update session
- `DELETE /api/admin/sessions/{id}` - Delete session

### Student Endpoints:
- `GET /api/sessions/available` - Get all currently active sessions
- `GET /api/subjects/{subjectId}/sessions` - Get sessions for quizzes in a subject

## Frontend Components

### Admin UI (`EditQuiz.tsx`):
- **Sessions Card**: Displays all sessions for the quiz
- **Add Session Form**: Create new sessions with batch name and times
- **Session List**: Shows all sessions with status badges
- **Delete Function**: Remove sessions

### Features:
- ✅ Create unlimited sessions per quiz
- ✅ Visual status indicators (Active/Upcoming/Ended)
- ✅ Easy-to-use date/time pickers
- ✅ Batch name customization
- ✅ Delete sessions
- ✅ Auto-refresh on changes

## Benefits

### 1. **Time Savings**
- Create quiz once, reuse multiple times
- No need to duplicate questions
- Centralized quiz management

### 2. **Fair Assessment**
- Same questions for all batches
- Equal difficulty across all sessions
- Consistent grading

### 3. **Flexibility**
- Schedule different time slots
- Accommodate multiple groups
- Easy rescheduling

### 4. **Better Organization**
- Track attempts by batch
- Analyze performance per session
- Batch-specific reporting

### 5. **Academic Integrity**
- Time-isolated sessions prevent cheating
- Students can't share answers between batches
- Each session has its own time window

## Example Workflow

### Setup (Admin):
```
1. Create "Algebra Final Exam" quiz
2. Add 20 questions
3. Set total time: 60 minutes
4. Set per-question time: 3 minutes
5. Publish quiz

6. Add Session 1:
   - Batch Name: "Batch A"
   - Start: Oct 15, 2025 10:00 AM
   - End: Oct 15, 2025 10:30 AM

7. Add Session 2:
   - Batch Name: "Batch B"
   - Start: Oct 15, 2025 12:00 PM
   - End: Oct 15, 2025 12:30 PM

...repeat for all batches
```

### Student Experience:
```
Batch A Student (at 10:15 AM):
- Sees "Algebra Final Exam - Batch A" (Active)
- Can start quiz
- Has until 10:30 AM to complete

Batch A Student (at 10:45 AM):
- Session expired
- Cannot start quiz

Batch B Student (at 10:15 AM):
- Cannot see Batch A session (not in their time window)
- Batch B not started yet

Batch B Student (at 12:10 PM):
- Sees "Algebra Final Exam - Batch B" (Active)
- Can start quiz
- Has until 12:30 PM to complete
```

## Technical Implementation

### Backend (Go):
1. **Model**: `QuizSession` struct with batch name and times
2. **Handlers**: Session CRUD operations
3. **Routes**: Admin and student endpoints
4. **Database**: Auto-migration via GORM

### Frontend (React + TypeScript):
1. **Types**: QuizSession interface
2. **API**: Session API functions
3. **UI**: Session management in EditQuiz page
4. **State**: React hooks for session data

## Migration Steps

1. **Backend**: Auto-creates `quiz_sessions` table on startup
2. **Existing Data**: Fully backward compatible (session_id is nullable)
3. **No Data Loss**: Existing quizzes work without sessions

## Future Enhancements

- [ ] Batch-wise analytics dashboard
- [ ] Email notifications to batches before session starts
- [ ] Duplicate session feature (clone with new times)
- [ ] Bulk session creation (upload CSV)
- [ ] Session templates (e.g., "Every Monday 10 AM")
- [ ] Automatic session generation (e.g., "Create 5 weekly sessions")

## Testing Checklist

- [x] Create quiz session via admin panel
- [x] Multiple sessions for same quiz
- [x] Session time validation (start < end)
- [x] Active/Upcoming/Ended status display
- [x] Delete session functionality
- [x] Students see only active sessions
- [x] Quiz attempts linked to sessions
- [x] Backward compatibility with non-session quizzes

## Support

If you need help with quiz sessions:
1. Check that the quiz is published
2. Verify session times are correct
3. Ensure session is marked as active
4. Check system time matches session times
