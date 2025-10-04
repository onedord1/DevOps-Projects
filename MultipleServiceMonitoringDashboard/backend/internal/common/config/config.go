package config

import (
    "fmt"
    "os"
    "strconv"

    "github.com/joho/godotenv"
)

type Config struct {
    Database DatabaseConfig
    NATS     NATSConfig
    JWT      JWTConfig
    Redis    RedisConfig
    Server   ServerConfig
}

type DatabaseConfig struct {
    URL string
}

type NATSConfig struct {
    URL string
}

type JWTConfig struct {
    Secret string
}

type RedisConfig struct {
    Addr     string
    Password string
    DB       int
}

type ServerConfig struct {
    Port string
}

func LoadConfig(path string) (*Config, error) {
    // Load .env file if it exists
    if err := godotenv.Load(path + "/.env"); err != nil {
        // It's okay if .env doesn't exist, we can use env vars
        fmt.Println("No .env file found, using environment variables")
    }

    return &Config{
        Database: DatabaseConfig{
            URL: getEnv("DATABASE_URL", "postgres://user:password@localhost/monitoring_db?sslmode=disable"),
        },
        NATS: NATSConfig{
            URL: getEnv("NATS_URL", "nats://localhost:4222"),
        },
        JWT: JWTConfig{
            Secret: getEnv("JWT_SECRET", "a-very-secret-key"),
        },
        Redis: RedisConfig{
            Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
            Password: getEnv("REDIS_PASSWORD", ""),
            DB:       getEnvAsInt("REDIS_DB", 0),
        },
        Server: ServerConfig{
            Port: getEnv("SERVER_PORT", "8080"),
        },
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if valueStr, exists := os.LookupEnv(key); exists {
        if value, err := strconv.Atoi(valueStr); err == nil {
            return value
        }
    }
    return defaultValue
}