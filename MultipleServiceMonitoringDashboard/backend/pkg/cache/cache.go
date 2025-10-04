package cache

import (
    "context"
	"time"
)

// Cache defines the interface for our caching solution.
type Cache interface {
    Get(ctx context.Context, key string) (string, error)
    Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
    Exists(ctx context.Context, key string) (bool, error)
    Del(ctx context.Context, key string) error
}