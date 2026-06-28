// Command payment authorizes charges for orders. It exposes the business
// metric `payments_total{result}` that backs the "payment success rate" SLO
// (Phase 7/9). FAIL_RATE / LATENCY_MS simulate a degraded payment provider for
// rollback demos.
package main

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/auth"
	"github.com/acme-commerce/platform/pkg/faults"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/prometheus/client_golang/prometheus"
)

func main() {
	a := app.New("payment")
	fault := faults.FromEnv()

	payments := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "payments_total",
		Help: "Payment authorization attempts by result.",
	}, []string{"result"})
	amount := prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "payment_amount_cents",
		Help:    "Authorized payment amounts in cents.",
		Buckets: []float64{500, 1000, 2500, 5000, 10000, 25000, 50000},
	})
	a.Metrics.Registry.MustRegister(payments, amount)

	verifier, err := auth.NewVerifier()
	if err != nil {
		a.Logger.Error("auth verifier init failed", "error", err)
		return
	}

	charge := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fault.Delay()
		var req struct {
			OrderID     string `json:"order_id"`
			AmountCents int    `json:"amount_cents"`
		}
		if err := httpx.DecodeJSON(r, &req); err != nil || req.AmountCents <= 0 || req.OrderID == "" {
			payments.WithLabelValues("bad_request").Inc()
			httpx.Error(w, http.StatusBadRequest, "invalid payment request")
			return
		}

		// Simulated provider failure (used to trip the payment-success SLO).
		if fault.ShouldFail() {
			payments.WithLabelValues("declined").Inc()
			httpx.Error(w, http.StatusPaymentRequired, "payment declined by provider")
			return
		}

		payments.WithLabelValues("success").Inc()
		amount.Observe(float64(req.AmountCents))
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"payment_id":   "pay_" + randID(),
			"order_id":     req.OrderID,
			"amount_cents": req.AmountCents,
			"status":       "authorized",
		})
	})
	a.Router.Handle("POST /payments", "charge", verifier.Require(charge).ServeHTTP)

	if err := a.Run(); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}

func randID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
