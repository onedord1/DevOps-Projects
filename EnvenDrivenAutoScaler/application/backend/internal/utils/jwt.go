package utils

import (
    "context"
    "errors"
    "sync"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    UserID uint `json:"user_id"`
    jwt.RegisteredClaims
}

type tokenCache struct {
    sync.RWMutex
    validTokens map[string]uint 
    expiry      map[string]time.Time 
}

var cache = &tokenCache{
    validTokens: make(map[string]uint),
    expiry:      make(map[string]time.Time),
}

func init() {
    go func() {
        ticker := time.NewTicker(5 * time.Minute)
        defer ticker.Stop()
        
        for range ticker.C {
            cache.cleanup()
        }
    }()
}

func (tc *tokenCache) cleanup() {
    tc.Lock()
    defer tc.Unlock()
    
    now := time.Now()
    for token, expiry := range tc.expiry {
        if now.After(expiry) {
            delete(tc.validTokens, token)
            delete(tc.expiry, token)
        }
    }
}

func (tc *tokenCache) get(token string) (uint, bool) {
    tc.RLock()
    defer tc.RUnlock()
    
    userID, exists := tc.validTokens[token]
    if !exists {
        return 0, false
    }
    
    if expiry, ok := tc.expiry[token]; ok && time.Now().After(expiry) {
        delete(tc.validTokens, token)
        delete(tc.expiry, token)
        return 0, false
    }
    
    return userID, true
}

func (tc *tokenCache) set(token string, userID uint, expiry time.Time) {
    tc.Lock()
    defer tc.Unlock()
    
    tc.validTokens[token] = userID
    tc.expiry[token] = expiry
}

func GenerateJWT(userID uint, secret string, expiry time.Duration) (string, error) {
    claims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func ValidateJWT(tokenString, secret string) (uint, error) {
    return ValidateJWTWithContext(context.Background(), tokenString, secret)
}

func ValidateJWTWithContext(ctx context.Context, tokenString, secret string) (uint, error) {
    
    if userID, found := cache.get(tokenString); found {
        return userID, nil
    }

    resultCh := make(chan uint, 1)
    errCh := make(chan error, 1)

    go func() {
        token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, errors.New("unexpected signing method")
            }
            return []byte(secret), nil
        })

        if err != nil {
            errCh <- err
            return
        }

        if claims, ok := token.Claims.(*Claims); ok && token.Valid {
            if expiry := claims.ExpiresAt; expiry != nil {
                cache.set(tokenString, claims.UserID, expiry.Time)
            }
            resultCh <- claims.UserID
            return
        }

        errCh <- jwt.ErrTokenInvalidClaims
    }()

    select {
    case userID := <-resultCh:
        return userID, nil
    case err := <-errCh:
        return 0, err
    case <-ctx.Done():
        return 0, ctx.Err()
    }
}


func ExtractTokenFromHeader(authHeader string) (string, error) {
    if authHeader == "" {
        return "", errors.New("authorization header is required")
    }

    const bearerPrefix = "Bearer "
    if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
        return "", errors.New("authorization header format must be Bearer {token}")
    }

    return authHeader[len(bearerPrefix):], nil
}

func RefreshToken(tokenString, secret string, expiry time.Duration) (string, error) {
    userID, err := ValidateJWT(tokenString, secret)
    if err != nil {
        return "", err
    }

    return GenerateJWT(userID, secret, expiry)
}