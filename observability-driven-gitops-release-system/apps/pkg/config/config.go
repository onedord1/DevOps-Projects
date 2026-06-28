// Package config provides 12-factor environment configuration helpers.
// Every service reads its configuration exclusively from the environment so
// the same binary runs identically in docker-compose, k3s, and production.
package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// String returns the env value for key, or def if unset/empty.
func String(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

// Int returns the env value parsed as int, or def on missing/invalid.
func Int(key string, def int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

// Float returns the env value parsed as float64, or def on missing/invalid.
func Float(key string, def float64) float64 {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return def
}

// Bool parses 1/true/yes/on (case-insensitive) as true.
func Bool(key string, def bool) bool {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		switch strings.ToLower(v) {
		case "1", "true", "yes", "on":
			return true
		case "0", "false", "no", "off":
			return false
		}
	}
	return def
}

// Duration parses a Go duration string (e.g. "250ms", "5s"), or def.
func Duration(key string, def time.Duration) time.Duration {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return def
}
