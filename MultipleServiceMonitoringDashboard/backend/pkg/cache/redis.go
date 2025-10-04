package cache

import (
    "context"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

// RedisCache implements the Cache interface using Redis.
type RedisCache struct {
    Client *redis.Client
}

// NewRedisCache creates a new RedisCache.
func NewRedisCache(addr, password string, db int) (*RedisCache, error) {
    rdb := redis.NewClient(&redis.Options{
        Addr:     addr,
        Password: password,
        DB:       db,
    })

    // Test the connection
    if err := rdb.Ping(context.Background()).Err(); err != nil {
        return nil, fmt.Errorf("unable to connect to Redis: %w", err)
    }

    return &RedisCache{Client: rdb}, nil
}

// Get retrieves a value from Redis.
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
    return c.Client.Get(ctx, key).Result()
}

// Set stores a value in Redis with an expiration time.
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
    return c.Client.Set(ctx, key, value, expiration).Err()
}

// Exists checks if a key exists in Redis.
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
    result, err := c.Client.Exists(ctx, key).Result()
    return result > 0, err
}

// Del deletes a key from Redis.
func (c *RedisCache) Del(ctx context.Context, key string) error {
    return c.Client.Del(ctx, key).Err()
}

// Close closes the Redis connection.
func (c *RedisCache) Close() error {
    return c.Client.Close()
}