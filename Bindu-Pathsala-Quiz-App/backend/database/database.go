package database

import (
	"fmt"
	"log"

	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/models"
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
