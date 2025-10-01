package config

import (
    "os"
    "strconv"
    "time"

    "github.com/joho/godotenv"
)

type Config struct {
    Database      DatabaseConfig
    JWT           JWTConfig
    Server        ServerConfig
    File          FileConfig
    Email         EmailConfig
    Elasticsearch ElasticsearchConfig
    Performance   PerformanceConfig
}

type DatabaseConfig struct {
    Driver              string
    Host                string
    Port                string
    Username            string
    Password            string
    DBName              string
    SSLMode             string
    MaxOpenConns        int 
    MaxIdleConns        int
    ConnMaxLifetime     time.Duration
    ConnMaxIdleTime     time.Duration
}

type JWTConfig struct {
    Secret     string
    ExpiryDays int
}

type ServerConfig struct {
    Port        string
    Environment string
    ReadTimeout time.Duration
    WriteTimeout time.Duration
    IdleTimeout  time.Duration
}

type FileConfig struct {
    UploadDir    string
    MaxFileSize  int64
    AllowedTypes []string
    StorageType  string
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

type PerformanceConfig struct {
    GOMAXPROCS     int
    GOGC           int
    GOMEMLIMIT     int64
    EnableProfiling bool
}

func Load() (*Config, error) {
    if err := godotenv.Load(); err != nil {
    }

    cfg := &Config{
        Database: DatabaseConfig{
            Driver:           getEnv("DB_DRIVER", "postgres"),
            Host:             getEnv("DB_HOST", "localhost"),
            Port:             getEnv("DB_PORT", "5432"),
            Username:         getEnv("DB_USERNAME", "postgres"),
            Password:         getEnv("DB_PASSWORD", ""),
            DBName:           getEnv("DB_NAME", "expense_tracker"),
            SSLMode:          getEnv("DB_SSL_MODE", "disable"),
            MaxOpenConns:     getEnvAsInt("DB_MAX_OPEN_CONNS", 100),
            MaxIdleConns:     getEnvAsInt("DB_MAX_IDLE_CONNS", 25),
            ConnMaxLifetime:  getEnvAsDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
            ConnMaxIdleTime:  getEnvAsDuration("DB_CONN_MAX_IDLE_TIME", 1*time.Minute),
        },
        JWT: JWTConfig{
            Secret:     getEnv("JWT_SECRET", "your-secret-key"),
            ExpiryDays: getEnvAsInt("JWT_EXPIRY_DAYS", 7),
        },
        Server: ServerConfig{
            Port:        getEnv("PORT", "8080"),
            Environment: getEnv("ENVIRONMENT", "development"),
            ReadTimeout: getEnvAsDuration("READ_TIMEOUT", 5*time.Second),
            WriteTimeout: getEnvAsDuration("WRITE_TIMEOUT", 10*time.Second),
            IdleTimeout:  getEnvAsDuration("IDLE_TIMEOUT", 120*time.Second),
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
        Elasticsearch: ElasticsearchConfig{
            URL:      getEnv("ELASTICSEARCH_URL", ""),
            Username: getEnv("ELASTICSEARCH_USERNAME", ""),
            Password: getEnv("ELASTICSEARCH_PASSWORD", ""),
            Index:    getEnv("ELASTICSEARCH_INDEX", "expenses"),
        },
        Performance: PerformanceConfig{
            GOMAXPROCS:     getEnvAsInt("GOMAXPROCS", 0), // 0 = use all available CPUs
            GOGC:           getEnvAsInt("GOGC", 100),
            GOMEMLIMIT:     getEnvAsInt64("GOMEMLIMIT", 1024*1024*1024), // 1GB default
            EnableProfiling: getEnvAsBool("ENABLE_PROFILING", false),
        },
    }

    return cfg, nil
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
    if value := os.Getenv(key); value != "" {
        if duration, err := time.ParseDuration(value); err == nil {
            return duration
        }
    }
    return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
    if value := os.Getenv(key); value != "" {
        if boolVal, err := strconv.ParseBool(value); err == nil {
            return boolVal
        }
    }
    return defaultValue
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