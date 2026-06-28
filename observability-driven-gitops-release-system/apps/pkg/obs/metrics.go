// Package obs provides the platform's observability primitives: Prometheus
// metrics (RED method) and OpenTelemetry tracing setup.
package obs

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics holds a service-scoped Prometheus registry plus the standard RED
// (Rate, Errors, Duration) HTTP metrics that every AnalysisTemplate in Phase 7
// relies on. Services register additional business metrics on Registry.
type Metrics struct {
	Registry *prometheus.Registry

	reqTotal *prometheus.CounterVec
	reqDur   *prometheus.HistogramVec
	inflight prometheus.Gauge
}

// NewMetrics builds a registry preloaded with Go runtime + process collectors
// and the RED HTTP metrics, all labeled with the service name.
func NewMetrics(service string) *Metrics {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	labels := prometheus.Labels{"service": service}

	m := &Metrics{
		Registry: reg,
		reqTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name:        "http_requests_total",
			Help:        "Total HTTP requests processed, partitioned by route, method and status code.",
			ConstLabels: labels,
		}, []string{"method", "route", "code"}),
		reqDur: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:        "http_request_duration_seconds",
			Help:        "HTTP request latency in seconds.",
			ConstLabels: labels,
			// Buckets tuned for low-latency web services; supports P95 SLOs.
			Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5},
		}, []string{"method", "route"}),
		inflight: prometheus.NewGauge(prometheus.GaugeOpts{
			Name:        "http_requests_in_flight",
			Help:        "Number of HTTP requests currently being served.",
			ConstLabels: labels,
		}),
	}
	reg.MustRegister(m.reqTotal, m.reqDur, m.inflight)
	return m
}

// Handler exposes the registry on /metrics.
func (m *Metrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.Registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
	})
}

// Measure wraps a handler with RED instrumentation for the given route label.
// The route label is fixed per registration to keep cardinality bounded.
func (m *Metrics) Measure(route string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m.inflight.Inc()
		defer m.inflight.Dec()

		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		elapsed := time.Since(start).Seconds()
		m.reqDur.WithLabelValues(r.Method, route).Observe(elapsed)
		m.reqTotal.WithLabelValues(r.Method, route, strconv.Itoa(rec.status)).Inc()
	})
}

// statusRecorder captures the response status code for metrics.
type statusRecorder struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (s *statusRecorder) WriteHeader(code int) {
	if !s.wroteHeader {
		s.status = code
		s.wroteHeader = true
	}
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusRecorder) Write(b []byte) (int, error) {
	s.wroteHeader = true
	return s.ResponseWriter.Write(b)
}
