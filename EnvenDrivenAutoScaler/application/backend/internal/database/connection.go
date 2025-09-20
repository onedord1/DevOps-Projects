package database

import (
    "fmt"

    "golang.org/x/crypto/bcrypt"
    "gorm.io/driver/mysql"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"

    "expense-tracker/internal/config"
    "expense-tracker/internal/models"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
    var dsn string
    var dialector gorm.Dialector

    switch cfg.Database.Driver {
    case "postgres":
        dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
            cfg.Database.Host,
            cfg.Database.Port,
            cfg.Database.Username,
            cfg.Database.Password,
            cfg.Database.DBName,
            cfg.Database.SSLMode,
        )
        dialector = postgres.Open(dsn)
    case "mysql":
        dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
            cfg.Database.Username,
            cfg.Database.Password,
            cfg.Database.Host,
            cfg.Database.Port,
            cfg.Database.DBName,
        )
        dialector = mysql.Open(dsn)
    default:
        return nil, fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
    }

    var logLevel logger.LogLevel
    if cfg.Server.Environment == "development" {
        logLevel = logger.Info
    } else {
        logLevel = logger.Silent
    }

    db, err := gorm.Open(dialector, &gorm.Config{
        Logger: logger.Default.LogMode(logLevel),
    })
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // Auto migrate models
    err = db.AutoMigrate(
        &models.User{},
        &models.Category{},
        &models.Transaction{},
        &models.Budget{},
        &models.RecurringExpense{},
    )
    if err != nil {
        return nil, fmt.Errorf("failed to run migrations: %w", err)
    }

    return db, nil
}

func RunMigrations(db *gorm.DB, cfg *config.Config) error {
    // Create system user if it doesn't exist
    systemUserID, err := createSystemUser(db)
    if err != nil {
        return err
    }

    // Seed default categories
    return seedDefaultCategories(db, systemUserID)
}

func createSystemUser(db *gorm.DB) (uint, error) {
    var systemUser models.User
    result := db.Where("email = ?", "system@expensetracker.local").First(&systemUser)
    
    if result.Error == nil {
        // System user already exists
        return systemUser.ID, nil
    }
    
    if result.Error != gorm.ErrRecordNotFound {
        // Some other error occurred
        return 0, result.Error
    }
    
    // Create a new system user
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte("system-password"), bcrypt.DefaultCost)
    if err != nil {
        return 0, fmt.Errorf("failed to hash password for system user: %w", err)
    }
    
    systemUser = models.User{
        Name:        "System",
        Email:       "system@expensetracker.local",
        PasswordHash: string(hashedPassword),
        Role:        "system",
    }
    
    if err := db.Create(&systemUser).Error; err != nil {
        return 0, fmt.Errorf("failed to create system user: %w", err)
    }
    
    return systemUser.ID, nil
}

func seedDefaultCategories(db *gorm.DB, systemUserID uint) error {
    // Convert string types to models.CategoryType
    defaultCategories := []models.Category{
        {Name: "Food & Dining", Type: "expense", Color: "#F59E0B", Icon: "🍕", UserID: systemUserID},
        {Name: "Transportation", Type: "expense", Color: "#3B82F6", Icon: "🚗", UserID: systemUserID},
        {Name: "Shopping", Type: "expense", Color: "#EC4899", Icon: "🛍️", UserID: systemUserID},
        {Name: "Entertainment", Type: "expense", Color: "#8B5CF6", Icon: "🎬", UserID: systemUserID},
        {Name: "Bills & Utilities", Type: "expense", Color: "#EF4444", Icon: "⚡", UserID: systemUserID},
        {Name: "Healthcare", Type: "expense", Color: "#10B981", Icon: "🏥", UserID: systemUserID},
        {Name: "Education", Type: "expense", Color: "#6366F1", Icon: "📚", UserID: systemUserID},
        {Name: "Salary", Type: "income", Color: "#059669", Icon: "💰", UserID: systemUserID},
        {Name: "Freelance", Type: "income", Color: "#0891B2", Icon: "💻", UserID: systemUserID},
        {Name: "Investment", Type: "income", Color: "#7C3AED", Icon: "📈", UserID: systemUserID},
    }

    for _, category := range defaultCategories {
        var count int64
        db.Model(&models.Category{}).Where("name = ? AND user_id = ?", category.Name, systemUserID).Count(&count)
        if count == 0 {
            if err := db.Create(&category).Error; err != nil {
                return fmt.Errorf("failed to create category %s: %w", category.Name, err)
            }
        }
    }

    return nil
}