// Script to fix admin and student passwords in the database
// Run with: node fix-passwords.js

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'quiz_hosting',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Generate hash for admin password
    const adminHash = await bcrypt.hash('admin123', 10);
    console.log(`\n📝 Generated hash for 'admin123': ${adminHash}`);

    // Update admin password
    const adminResult = await client.query(
      'UPDATE users SET password_hash = $1 WHERE student_id = $2',
      [adminHash, 'ADMIN001']
    );
    console.log(`✅ Admin password updated! Rows affected: ${adminResult.rowCount}`);

    // Generate hash for student password
    const studentHash = await bcrypt.hash('student123', 10);
    console.log(`\n📝 Generated hash for 'student123': ${studentHash}`);

    // Update student passwords
    const studentResult = await client.query(
      "UPDATE users SET password_hash = $1 WHERE student_id LIKE 'STU%'",
      [studentHash]
    );
    console.log(`✅ Student passwords updated! Rows affected: ${studentResult.rowCount}`);

    // Verify users
    const users = await client.query(
      "SELECT student_id, name, role FROM users WHERE student_id IN ('ADMIN001', 'STU001', 'STU002')"
    );
    console.log('\n📋 Updated users:');
    console.table(users.rows);

    console.log('\n🎉 All passwords fixed successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin: ADMIN001 / admin123');
    console.log('  Student: STU001 / student123');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fixPasswords();
