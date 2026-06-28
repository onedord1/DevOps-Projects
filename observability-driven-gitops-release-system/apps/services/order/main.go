// Command order orchestrates checkout: it reserves stock (inventory), charges
// the customer (payment), and publishes an `order.created` event (NATS). The
// business metric `orders_total{result}` backs the "checkout success rate" SLO.
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/auth"
	"github.com/acme-commerce/platform/pkg/config"
	"github.com/acme-commerce/platform/pkg/events"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/prometheus/client_golang/prometheus"
)

type lineItem struct {
	SKU string `json:"sku"`
	Qty int    `json:"qty"`
}

type orderService struct {
	app          *app.App
	client       *http.Client
	bus          *events.Bus
	inventoryURL string
	paymentURL   string
	orders       *prometheus.CounterVec
}

func main() {
	a := app.New("order")

	orders := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "orders_total",
		Help: "Checkout attempts by result.",
	}, []string{"result"})
	a.Metrics.Registry.MustRegister(orders)

	verifier, err := auth.NewVerifier()
	if err != nil {
		a.Logger.Error("auth verifier init failed", "error", err)
		return
	}

	bus, err := events.Connect(config.String("NATS_URL", ""), a.Logger)
	if err != nil {
		a.Logger.Error("events connect failed", "error", err)
		return
	}
	defer bus.Close()
	if err := bus.EnsureStream(context.Background(), events.StreamOrders, "order.>"); err != nil {
		a.Logger.Warn("ensure stream failed", "error", err)
	}
	a.Health.Register("nats", bus.Ready)

	svc := &orderService{
		app:          a,
		client:       httpx.NewClient(5 * time.Second),
		bus:          bus,
		inventoryURL: config.String("INVENTORY_URL", "http://inventory:8080"),
		paymentURL:   config.String("PAYMENT_URL", "http://payment:8080"),
		orders:       orders,
	}

	a.Router.Handle("POST /orders", "create_order", verifier.Require(http.HandlerFunc(svc.createOrder)).ServeHTTP)

	if err := a.Run(); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}

func (s *orderService) createOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Items []lineItem `json:"items"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil || len(req.Items) == 0 {
		s.orders.WithLabelValues("bad_request").Inc()
		httpx.Error(w, http.StatusBadRequest, "order must contain at least one item")
		return
	}
	token := r.Header.Get("Authorization")
	ctx := r.Context()

	prices, err := s.fetchPrices(ctx, token)
	if err != nil {
		s.orders.WithLabelValues("failed").Inc()
		httpx.Error(w, http.StatusBadGateway, "inventory unavailable")
		return
	}

	total := 0
	for _, it := range req.Items {
		price, ok := prices[it.SKU]
		if !ok {
			s.orders.WithLabelValues("failed").Inc()
			httpx.Error(w, http.StatusBadRequest, "unknown sku: "+it.SKU)
			return
		}
		if err := s.reserve(ctx, token, it); err != nil {
			s.orders.WithLabelValues("failed").Inc()
			httpx.Error(w, http.StatusConflict, fmt.Sprintf("reservation failed for %s: %v", it.SKU, err))
			return
		}
		total += price * it.Qty
	}

	orderID := "ord_" + randID()
	if err := s.charge(ctx, token, orderID, total); err != nil {
		s.orders.WithLabelValues("failed").Inc()
		_ = s.bus.Publish(ctx, events.SubjectOrderFailed, map[string]any{"order_id": orderID, "reason": err.Error()})
		httpx.Error(w, http.StatusPaymentRequired, "payment failed")
		return
	}

	order := map[string]any{
		"order_id":     orderID,
		"items":        req.Items,
		"total_cents":  total,
		"status":       "confirmed",
		"created_at":   time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.bus.Publish(ctx, events.SubjectOrderCreated, order); err != nil {
		s.app.Logger.Warn("publish order.created failed", "error", err)
	}

	s.orders.WithLabelValues("success").Inc()
	httpx.WriteJSON(w, http.StatusCreated, order)
}

func (s *orderService) fetchPrices(ctx context.Context, token string) (map[string]int, error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, s.inventoryURL+"/inventory/items", nil)
	forward(req, token)
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("inventory status %d", resp.StatusCode)
	}
	var body struct {
		Items []struct {
			SKU   string `json:"sku"`
			Price int    `json:"price_cents"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	prices := make(map[string]int, len(body.Items))
	for _, it := range body.Items {
		prices[it.SKU] = it.Price
	}
	return prices, nil
}

func (s *orderService) reserve(ctx context.Context, token string, it lineItem) error {
	return s.postJSON(ctx, token, s.inventoryURL+"/inventory/reserve", it, http.StatusOK)
}

func (s *orderService) charge(ctx context.Context, token, orderID string, total int) error {
	payload := map[string]any{"order_id": orderID, "amount_cents": total}
	return s.postJSON(ctx, token, s.paymentURL+"/payments", payload, http.StatusOK)
}

func (s *orderService) postJSON(ctx context.Context, token, url string, payload any, want int) error {
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	forward(req, token)
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != want {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 256))
		return fmt.Errorf("status %d: %s", resp.StatusCode, bytes.TrimSpace(msg))
	}
	return nil
}

func forward(req *http.Request, token string) {
	if token != "" {
		req.Header.Set("Authorization", token)
	}
}

func randID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
