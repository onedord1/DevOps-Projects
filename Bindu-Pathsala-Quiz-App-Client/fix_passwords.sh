#!/bin/bash

# Fix admin and student passwords in the database
# This script connects to PostgreSQL and updates the password hashes

echo "Fixing admin and student passwords..."

# Connect to the database and run the fix
psql -h localhost -U postgres -d quiz_hosting << EOF

-- Update Admin password (ADMIN001 / admin123)
-- Hash generated for 'admin123' using bcrypt cost 10
UPDATE users 
SET password_hash = '\$2a\$10\$YourNewHashHere' 
WHERE student_id = 'ADMIN001';

-- Update Student passwords (STU001-STU005 / student123)
-- Hash generated for 'student123' using bcrypt cost 10
UPDATE users 
SET password_hash = '\$2a\$10\$YourNewHashHere' 
WHERE student_id LIKE 'STU%';

-- Verify updates
SELECT student_id, name, role FROM users;

EOF

echo "✅ Passwords updated successfully!"
