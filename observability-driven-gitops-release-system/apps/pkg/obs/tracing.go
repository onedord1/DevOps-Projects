package obs

import (
	"context"
	"log/slog"

	"github.com/acme-commerce/platform/pkg/config"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// ShutdownFunc flushes and stops the tracer provider.
type ShutdownFunc func(context.Context) error

// InitTracing configures OpenTelemetry tracing with an OTLP/HTTP exporter.
//
// The exporter endpoint is read from the standard OTEL_EXPORTER_OTLP_ENDPOINT
// environment variable (e.g. http://otel-collector:4318). When it is unset,
// tracing is wired as a no-op: the W3C propagator is still installed so trace
// context flows between services, but no spans are exported. This lets the
// services run locally without a collector while remaining fully traced in the
// cluster (Phase 5).
func InitTracing(ctx context.Context, service, version string, logger *slog.Logger) (ShutdownFunc, error) {
	// Always propagate W3C trace context + baggage across service boundaries.
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	endpoint := config.String("OTEL_EXPORTER_OTLP_ENDPOINT", "")
	if endpoint == "" {
		logger.Info("tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set")
		return func(context.Context) error { return nil }, nil
	}

	exp, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, err
	}

	res := resource.NewSchemaless(
		attribute.String("service.name", service),
		attribute.String("service.version", version),
	)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	logger.Info("tracing enabled", slog.String("otlp_endpoint", endpoint))

	return tp.Shutdown, nil
}
