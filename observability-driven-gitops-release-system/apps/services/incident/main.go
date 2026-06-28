// Command incident is the platform's incident webhook. It receives Alertmanager
// alerts and Argo Rollouts notifications, opens/resolves in-memory incidents,
// and exposes them plus Prometheus metrics. On a rollout abort (automatic
// rollback) it records a critical incident — closing the "rollback → incident"
// loop (ADR-0013). Grafana deploy annotations are emitted by Argo Rollouts'
// built-in notifier, so this service stays focused on incident bookkeeping.
package main

import (
	"net/http"
	"sort"
	"sync"
	"time"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/prometheus/client_golang/prometheus"
)

type incident struct {
	ID          string    `json:"id"`
	Source      string    `json:"source"`   // alertmanager | rollout
	Service     string    `json:"service"`  // affected service
	Severity    string    `json:"severity"` // critical | warning | info
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // open | resolved
	CreatedAt   time.Time `json:"created_at"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
}

type store struct {
	mu        sync.Mutex
	byKey     map[string]*incident // dedup key -> open incident
	all       []*incident
	created   *prometheus.CounterVec
	openGauge *prometheus.GaugeVec
}

func newStore(reg *prometheus.Registry) *store {
	created := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "incidents_total",
		Help: "Incidents opened, partitioned by source, severity and service.",
	}, []string{"source", "severity", "service"})
	openG := prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "incidents_open",
		Help: "Currently open incidents by severity.",
	}, []string{"severity"})
	reg.MustRegister(created, openG)
	return &store{byKey: map[string]*incident{}, created: created, openGauge: openG}
}

func (s *store) open(key string, inc *incident) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.byKey[key]; exists {
		return // already open (dedup)
	}
	inc.Status = "open"
	inc.CreatedAt = time.Now().UTC()
	s.byKey[key] = inc
	s.all = append(s.all, inc)
	s.created.WithLabelValues(inc.Source, inc.Severity, inc.Service).Inc()
	s.openGauge.WithLabelValues(inc.Severity).Inc()
}

func (s *store) resolve(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	inc, ok := s.byKey[key]
	if !ok {
		return
	}
	now := time.Now().UTC()
	inc.Status = "resolved"
	inc.ResolvedAt = &now
	s.openGauge.WithLabelValues(inc.Severity).Dec()
	delete(s.byKey, key)
}

func (s *store) list() []incident {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]incident, 0, len(s.all))
	for _, i := range s.all {
		out = append(out, *i)
	}
	sort.Slice(out, func(a, b int) bool { return out[a].CreatedAt.After(out[b].CreatedAt) })
	return out
}

// --- Alertmanager webhook payload (subset) ---------------------------------
type amPayload struct {
	Status string `json:"status"`
	Alerts []struct {
		Status      string            `json:"status"`
		Labels      map[string]string `json:"labels"`
		Annotations map[string]string `json:"annotations"`
	} `json:"alerts"`
}

// --- Argo Rollouts webhook payload (defined by our notification template) ---
type rolloutPayload struct {
	Event     string `json:"event"`   // aborted | completed
	Rollout   string `json:"rollout"`
	Namespace string `json:"namespace"`
	Revision  string `json:"revision"`
	Message   string `json:"message"`
}

func main() {
	a := app.New("incident")
	st := newStore(a.Metrics.Registry)

	a.Router.Handle("POST /alertmanager", "alertmanager", func(w http.ResponseWriter, r *http.Request) {
		var p amPayload
		if err := httpx.DecodeJSON(r, &p); err != nil {
			httpx.Error(w, http.StatusBadRequest, "invalid alertmanager payload")
			return
		}
		for _, al := range p.Alerts {
			name := firstNonEmpty(al.Labels["alertname"], "alert")
			svc := firstNonEmpty(al.Labels["service"], al.Labels["job"], "unknown")
			sev := firstNonEmpty(al.Labels["severity"], "warning")
			key := "am/" + name + "/" + svc
			if al.Status == "resolved" {
				st.resolve(key)
				continue
			}
			st.open(key, &incident{
				Source:      "alertmanager",
				Service:     svc,
				Severity:    sev,
				Title:       firstNonEmpty(al.Annotations["summary"], name),
				Description: al.Annotations["description"],
			})
		}
		a.Logger.Info("alertmanager webhook", "status", p.Status, "alerts", len(p.Alerts))
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "accepted"})
	})

	a.Router.Handle("POST /rollout", "rollout", func(w http.ResponseWriter, r *http.Request) {
		var p rolloutPayload
		if err := httpx.DecodeJSON(r, &p); err != nil {
			httpx.Error(w, http.StatusBadRequest, "invalid rollout payload")
			return
		}
		key := "rollout/" + p.Namespace + "/" + p.Rollout
		switch p.Event {
		case "aborted":
			st.open(key, &incident{
				Source:      "rollout",
				Service:     p.Rollout,
				Severity:    "critical",
				Title:       "Rollout aborted: " + p.Rollout,
				Description: firstNonEmpty(p.Message, "Canary analysis failed; automatic rollback to the stable version."),
			})
			a.Logger.Error("rollout aborted — incident opened", "rollout", p.Rollout, "namespace", p.Namespace, "revision", p.Revision)
		case "completed":
			st.resolve(key)
			a.Logger.Info("rollout completed — incident resolved if open", "rollout", p.Rollout)
		default:
			a.Logger.Info("rollout event", "event", p.Event, "rollout", p.Rollout)
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "accepted"})
	})

	a.Router.Handle("GET /incidents", "incidents", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"incidents": st.list()})
	})

	if err := a.Run(); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
