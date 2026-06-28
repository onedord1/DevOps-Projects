// Command inventory tracks stock for Acme products and reserves it during
// checkout. It exposes RED metrics plus the business metric
// `inventory_reservations_total{result}` used by Phase 7 AnalysisTemplates.
package main

import (
	"net/http"
	"sync"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/auth"
	"github.com/acme-commerce/platform/pkg/faults"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/prometheus/client_golang/prometheus"
)

type item struct {
	SKU   string `json:"sku"`
	Name  string `json:"name"`
	Price int    `json:"price_cents"`
	Stock int    `json:"stock"`
}

type store struct {
	mu    sync.Mutex
	items map[string]*item
}

func seed() *store {
	return &store{items: map[string]*item{
		"SKU-TSHIRT":  {SKU: "SKU-TSHIRT", Name: "Acme T-Shirt", Price: 1999, Stock: 100},
		"SKU-MUG":     {SKU: "SKU-MUG", Name: "Acme Mug", Price: 1299, Stock: 80},
		"SKU-STICKER": {SKU: "SKU-STICKER", Name: "Acme Sticker Pack", Price: 499, Stock: 500},
		"SKU-HOODIE":  {SKU: "SKU-HOODIE", Name: "Acme Hoodie", Price: 4999, Stock: 40},
	}}
}

func main() {
	a := app.New("inventory")
	st := seed()
	fault := faults.FromEnv()

	reservations := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "inventory_reservations_total",
		Help: "Stock reservation attempts by result.",
	}, []string{"result"})
	stockGauge := prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "inventory_stock_units",
		Help: "Current stock units per SKU.",
	}, []string{"sku"})
	a.Metrics.Registry.MustRegister(reservations, stockGauge)
	st.publishStock(stockGauge)

	verifier, err := auth.NewVerifier()
	if err != nil {
		a.Logger.Error("auth verifier init failed", "error", err)
		return
	}

	// Public catalog listing.
	a.Router.Handle("GET /inventory/items", "list_items", func(w http.ResponseWriter, r *http.Request) {
		fault.Delay()
		st.mu.Lock()
		defer st.mu.Unlock()
		out := make([]item, 0, len(st.items))
		for _, it := range st.items {
			out = append(out, *it)
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": out})
	})

	// Authenticated reservation.
	reserve := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fault.Delay()
		var req struct {
			SKU string `json:"sku"`
			Qty int    `json:"qty"`
		}
		if err := httpx.DecodeJSON(r, &req); err != nil || req.Qty <= 0 {
			reservations.WithLabelValues("bad_request").Inc()
			httpx.Error(w, http.StatusBadRequest, "invalid reservation request")
			return
		}
		if fault.ShouldFail() {
			reservations.WithLabelValues("error").Inc()
			httpx.Error(w, http.StatusInternalServerError, "inventory fault injected")
			return
		}

		st.mu.Lock()
		defer st.mu.Unlock()
		it, ok := st.items[req.SKU]
		if !ok {
			reservations.WithLabelValues("not_found").Inc()
			httpx.Error(w, http.StatusNotFound, "unknown sku")
			return
		}
		if it.Stock < req.Qty {
			reservations.WithLabelValues("out_of_stock").Inc()
			httpx.Error(w, http.StatusConflict, "insufficient stock")
			return
		}
		it.Stock -= req.Qty
		stockGauge.WithLabelValues(it.SKU).Set(float64(it.Stock))
		reservations.WithLabelValues("success").Inc()
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"sku": it.SKU, "reserved": req.Qty, "remaining": it.Stock,
		})
	})
	a.Router.Handle("POST /inventory/reserve", "reserve", verifier.Require(reserve).ServeHTTP)

	if err := a.Run(); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}

func (s *store) publishStock(g *prometheus.GaugeVec) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, it := range s.items {
		g.WithLabelValues(it.SKU).Set(float64(it.Stock))
	}
}
