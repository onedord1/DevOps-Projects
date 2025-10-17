package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize connects to the database and performs migrations
func Initialize(cfg *config.Config) error {
	var err error
	
	dsn := cfg.GetDSN()
	
	// Set logger based on environment
	logLevel := logger.Silent
	if cfg.Server.Env == "development" {
		logLevel = logger.Info
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection established")

	// Auto-migrate models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Subject{},
		&models.Quiz{},
		&models.QuizSession{},
		&models.Question{},
		&models.Option{},
		&models.QuizAttempt{},
		&models.Answer{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migrations completed")

	// Run SQL migrations
	if err := runMigrations(DB); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Reset admin password to ensure it matches expected credentials
	if err := ResetAdminPassword(DB); err != nil {
		log.Printf("Warning: Failed to reset admin password: %v", err)
		// Don't fail initialization for this, as admin user might already exist with correct password
	}

	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// Close closes the database connection
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// ResetAdminPassword resets the admin user's password to 'Admin123'
func ResetAdminPassword(db *gorm.DB) error {
	// Generate bcrypt hash for Admin123
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update admin user's password
	result := db.Model(&models.User{}).Where("student_id = ?", "AD123456").Update("password_hash", string(hashedPassword))
	if result.Error != nil {
		return fmt.Errorf("failed to update admin password: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("admin user not found")
	}

	log.Println("Admin password reset to 'Admin123' successfully")
	return nil
}

// runMigrations runs SQL migration files
func runMigrations(db *gorm.DB) error {
	migrationsDir := "migrations"

	// Get all .up.sql files and sort them
	var migrationFiles []string
	err := filepath.Walk(migrationsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if strings.HasSuffix(path, ".up.sql") {
			migrationFiles = append(migrationFiles, path)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Sort migration files by name (they should be numbered)
	sort.Strings(migrationFiles)

	// Run each migration file
	for _, file := range migrationFiles {
		log.Printf("Running migration: %s", file)

		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		// For schema migrations, execute the entire file at once to preserve function definitions
		if strings.Contains(file, "000001_init_schema") {
			if err := db.Exec(string(content)).Error; err != nil {
				// Handle "already exists" errors for schema objects
				errMsg := err.Error()
				if strings.Contains(errMsg, "already exists") ||
				   strings.Contains(errMsg, "type \"") && strings.Contains(errMsg, "\" already exists") ||
				   strings.Contains(errMsg, "relation \"") && strings.Contains(errMsg, "\" already exists") ||
				   strings.Contains(errMsg, "index \"") && strings.Contains(errMsg, "\" already exists") ||
				   strings.Contains(errMsg, "function \"") && strings.Contains(errMsg, "\" already exists") {
					log.Printf("Skipping already existing schema objects in %s", file)
					continue
				}
				return fmt.Errorf("failed to execute schema migration %s: %w", file, err)
			}
		} else {
			// For seed data, split by semicolon to run individual statements
			statements := strings.Split(string(content), ";")
			for _, stmt := range statements {
				stmt = strings.TrimSpace(stmt)
				if stmt == "" {
					continue
				}

				// Skip comments
				if strings.HasPrefix(stmt, "--") {
					continue
				}

				if err := db.Exec(stmt).Error; err != nil {
					return fmt.Errorf("failed to execute migration statement in %s: %w", file, err)
				}
			}
		}
	}

	log.Println("All migrations completed successfully")
	return nil
}
