package httpx

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/acme-commerce/platform/pkg/obs"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// Router wraps http.ServeMux to register routes with a stable metric label and
// per-route RED instrumentation.
type Router struct {
	mux     *http.ServeMux
	metrics *obs.Metrics
}

// NewRouter creates a router bound to the given metrics registry.
func NewRouter(metrics *obs.Metrics) *Router {
	return &Router{mux: http.NewServeMux(), metrics: metrics}
}

// Handle registers a handler for a Go 1.22+ pattern (e.g. "POST /orders").
// The route label keeps Prometheus cardinality bounded regardless of path
// parameters.
func (rt *Router) Handle(pattern, route string, h http.HandlerFunc) {
	rt.mux.Handle(pattern, rt.metrics.Measure(route, h))
}

// HandlePlain registers a handler without RED instrumentation (used for
// /metrics itself to avoid recursive measurement).
func (rt *Router) HandlePlain(pattern string, h http.Handler) {
	rt.mux.Handle(pattern, h)
}

// Server is the platform's HTTP server with graceful shutdown.
type Server struct {
	srv    *http.Server
	logger *slog.Logger
}

// NewServer builds a server. Inbound requests are wrapped with otelhttp so each
// request becomes a span and trace context is extracted from incoming headers.
func NewServer(addr string, router *Router, logger *slog.Logger, mws ...Middleware) *Server {
	handler := Chain(router.mux, mws...)
	handler = otelhttp.NewHandler(handler, "http.server")

	return &Server{
		srv: &http.Server{
			Addr:              addr,
			Handler:           handler,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       30 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       60 * time.Second,
		},
		logger: logger,
	}
}

// Serve blocks serving requests until Shutdown is called. A clean shutdown
// returns nil.
func (s *Server) Serve() error {
	s.logger.Info("http server listening", slog.String("addr", s.srv.Addr))
	if err := s.srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

// Shutdown drains in-flight connections within the context deadline.
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("draining connections")
	return s.srv.Shutdown(ctx)
}

// NewClient returns an HTTP client whose transport propagates trace context to
// downstream services, producing connected distributed traces.
func NewClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout:   timeout,
		Transport: otelhttp.NewTransport(http.DefaultTransport),
	}
}
