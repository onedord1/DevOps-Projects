package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Database connection
	dsn := "host=localhost user=postgres password=postgres dbname=quiz_hosting port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Generate correct bcrypt hash for "admin123"
	password := "admin123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	fmt.Printf("Generated hash for 'admin123': %s\n", string(hashedPassword))

	// Update admin user password
	result := db.Exec("UPDATE users SET password_hash = ? WHERE student_id = ?", string(hashedPassword), "ADMIN001")
	if result.Error != nil {
		log.Fatal("Failed to update password:", result.Error)
	}

	fmt.Printf("✅ Admin password updated successfully! Rows affected: %d\n", result.RowsAffected)
	
	// Also update student passwords
	studentPassword := "student123"
	hashedStudentPassword, err := bcrypt.GenerateFromPassword([]byte(studentPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash student password:", err)
	}

	result = db.Exec("UPDATE users SET password_hash = ? WHERE student_id LIKE 'STU%'", string(hashedStudentPassword))
	if result.Error != nil {
		log.Fatal("Failed to update student passwords:", result.Error)
	}

	fmt.Printf("✅ Student passwords updated successfully! Rows affected: %d\n", result.RowsAffected)
}
