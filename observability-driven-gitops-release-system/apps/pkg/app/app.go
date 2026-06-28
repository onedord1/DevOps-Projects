// Package app wires the common runtime for every Acme service: structured
// logging, OpenTelemetry tracing, Prometheus metrics, health endpoints, a
// router, an HTTP server with graceful shutdown, and optional background
// workers. A service's main() becomes a thin assembly of business routes.
package app

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/acme-commerce/platform/pkg/config"
	"github.com/acme-commerce/platform/pkg/health"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/acme-commerce/platform/pkg/logging"
	"github.com/acme-commerce/platform/pkg/obs"
)

// App is a fully wired service runtime.
type App struct {
	Name    string
	Version string
	Addr    string

	Logger  *slog.Logger
	Metrics *obs.Metrics
	Health  *health.Checker
	Router  *httpx.Router

	shutdownTracing obs.ShutdownFunc
}

// Worker is a background goroutine that runs for the lifetime of the service.
// It must return when its context is cancelled.
type Worker func(ctx context.Context) error

// New constructs the runtime for a service. It reads PORT (default 8080) and
// APP_VERSION (default "dev") from the environment and registers the standard
// /healthz, /readyz and /metrics endpoints.
func New(name string) *App {
	logger := logging.New(name)
	version := config.String("APP_VERSION", "dev")

	shutdown, err := obs.InitTracing(context.Background(), name, version, logger)
	if err != nil {
		logger.Warn("tracing init failed; continuing without it", slog.Any("error", err))
		shutdown = func(context.Context) error { return nil }
	}

	metrics := obs.NewMetrics(name)
	checker := health.New()
	router := httpx.NewRouter(metrics)

	a := &App{
		Name:            name,
		Version:         version,
		Addr:            ":" + config.String("PORT", "8080"),
		Logger:          logger,
		Metrics:         metrics,
		Health:          checker,
		Router:          router,
		shutdownTracing: shutdown,
	}

	// Standard platform endpoints.
	router.HandlePlain("GET /metrics", metrics.Handler())
	router.Handle("GET /healthz", "healthz", checker.Live)
	router.Handle("GET /readyz", "readyz", checker.Ready)

	return a
}

// Run starts background workers and the HTTP server, blocking until SIGINT or
// SIGTERM, then drains connections and flushes telemetry.
func (a *App) Run(workers ...Worker) error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	server := httpx.NewServer(a.Addr, a.Router, a.Logger,
		httpx.Recover(a.Logger),
		httpx.RequestLog(a.Logger),
	)

	errCh := make(chan error, 1+len(workers))

	for _, w := range workers {
		go func(worker Worker) {
			if err := worker(ctx); err != nil {
				errCh <- err
			}
		}(w)
	}

	go func() {
		if err := server.Serve(); err != nil {
			errCh <- err
		}
	}()

	a.Logger.Info("service started", slog.String("name", a.Name), slog.String("version", a.Version))

	var runErr error
	select {
	case runErr = <-errCh:
		a.Logger.Error("fatal error, shutting down", slog.Any("error", runErr))
	case <-ctx.Done():
		a.Logger.Info("shutdown signal received")
	}

	stop() // stop receiving signals; cancels worker context
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		a.Logger.Error("server shutdown error", slog.Any("error", err))
	}
	if err := a.shutdownTracing(shutdownCtx); err != nil {
		a.Logger.Error("tracing shutdown error", slog.Any("error", err))
	}
	a.Logger.Info("stopped")
	_ = os.Stdout.Sync()
	return runErr
}
