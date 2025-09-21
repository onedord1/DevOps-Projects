package config

import (
    "os"
    "strconv"

    "github.com/joho/godotenv"
)

type Config struct {
    Database      DatabaseConfig
    JWT           JWTConfig
    Server        ServerConfig
    File          FileConfig
    Email         EmailConfig
    Elasticsearch ElasticsearchConfig // Add this
}

type DatabaseConfig struct {
    Driver   string
    Host     string
    Port     string
    Username string
    Password string
    DBName   string
    SSLMode  string
}

type JWTConfig struct {
    Secret     string
    ExpiryDays int
}

type ServerConfig struct {
    Port        string
    Environment string
}

type FileConfig struct {
    UploadDir    string
    MaxFileSize  int64
    AllowedTypes []string
    StorageType  string // "local" or "cloud"
}

type EmailConfig struct {
    SMTPHost     string
    SMTPPort     string
    SMTPUsername string
    SMTPPassword string
    FromEmail    string
}

type ElasticsearchConfig struct {
    URL      string `mapstructure:"URL"`
    Username string `mapstructure:"USERNAME"`
    Password string `mapstructure:"PASSWORD"`
    Index    string `mapstructure:"INDEX"`
}

func Load() (*Config, error) {
    if err := godotenv.Load(); err != nil {
        // It's okay if .env file doesn't exist in production
    }

    cfg := &Config{
        Database: DatabaseConfig{
            Driver:   getEnv("DB_DRIVER", "postgres"),
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnv("DB_PORT", "5432"),
            Username: getEnv("DB_USERNAME", "postgres"),
            Password: getEnv("DB_PASSWORD", ""),
            DBName:   getEnv("DB_NAME", "expense_tracker"),
            SSLMode:  getEnv("DB_SSL_MODE", "disable"),
        },
        JWT: JWTConfig{
            Secret:     getEnv("JWT_SECRET", "your-secret-key"),
            ExpiryDays: getEnvAsInt("JWT_EXPIRY_DAYS", 7),
        },
        Server: ServerConfig{
            Port:        getEnv("PORT", "8080"),
            Environment: getEnv("ENVIRONMENT", "development"),
        },
        File: FileConfig{
            UploadDir:    getEnv("UPLOAD_DIR", "./uploads"),
            MaxFileSize:  getEnvAsInt64("MAX_FILE_SIZE", 10485760), // 10MB
            AllowedTypes: []string{"image/jpeg", "image/png", "image/gif", "application/pdf"},
            StorageType:  getEnv("STORAGE_TYPE", "local"),
        },
        Email: EmailConfig{
            SMTPHost:     getEnv("SMTP_HOST", ""),
            SMTPPort:     getEnv("SMTP_PORT", "587"),
            SMTPUsername: getEnv("SMTP_USERNAME", ""),
            SMTPPassword: getEnv("SMTP_PASSWORD", ""),
            FromEmail:    getEnv("FROM_EMAIL", ""),
        },
        Elasticsearch: ElasticsearchConfig{ // Add this
            URL:      getEnv("ELASTICSEARCH_URL", ""),
            Username: getEnv("ELASTICSEARCH_USERNAME", ""),
            Password: getEnv("ELASTICSEARCH_PASSWORD", ""),
            Index:    getEnv("ELASTICSEARCH_INDEX", "expenses"),
        },
    }

    return cfg, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.Atoi(value); err == nil {
            return intVal
        }
    }
    return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
            return intVal
        }
    }
    return defaultValue
}