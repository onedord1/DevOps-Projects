// Package logging configures structured JSON logging via log/slog.
// Structured logs are required so Loki (Phase 5) can parse and index them.
package logging

import (
	"log/slog"
	"os"
	"strings"

	"github.com/acme-commerce/platform/pkg/config"
)

// New returns a JSON slog.Logger tagged with the service name. The level is
// controlled by LOG_LEVEL (debug|info|warn|error), defaulting to info.
func New(service string) *slog.Logger {
	var level slog.Level
	switch strings.ToLower(config.String("LOG_LEVEL", "info")) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	return slog.New(handler).With(
		slog.String("service", service),
	)
}
