// Command frontend is the Acme storefront BFF. It is the auth entry point
// (issues EdDSA JWTs on login, serves JWKS) and proxies storefront calls to the
// order and inventory services, propagating the caller's token and trace
// context. Business metrics: frontend_logins_total / frontend_checkouts_total.
package main

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"time"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/auth"
	"github.com/acme-commerce/platform/pkg/config"
	"github.com/acme-commerce/platform/pkg/httpx"
	"github.com/prometheus/client_golang/prometheus"
)

const indexHTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Acme Commerce</title>
<style>body{font-family:system-ui,sans-serif;margin:3rem auto;max-width:40rem;line-height:1.5}code{background:#f0f0f0;padding:.1rem .3rem;border-radius:3px}</style>
</head><body>
<h1>🛒 Acme Commerce</h1>
<p>Storefront BFF for the Progressive Delivery Platform demo.</p>
<ul>
<li><code>POST /login</code> — get a demo JWT</li>
<li><code>GET /api/products</code> — list catalog</li>
<li><code>POST /api/checkout</code> — place an order (Bearer token required)</li>
<li><code>GET /.well-known/jwks.json</code> — token verification keys</li>
<li><code>GET /metrics</code> · <code>GET /healthz</code> · <code>GET /readyz</code></li>
</ul></body></html>`

func main() {
	a := app.New("frontend")

	logins := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "frontend_logins_total",
		Help: "Login attempts by result.",
	}, []string{"result"})
	checkouts := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "frontend_checkouts_total",
		Help: "Checkout attempts proxied to the order service, by result.",
	}, []string{"result"})
	a.Metrics.Registry.MustRegister(logins, checkouts)

	issuer, err := auth.NewIssuer()
	if err != nil {
		a.Logger.Error("auth issuer init failed", "error", err)
		return
	}

	client := httpx.NewClient(5 * time.Second)
	orderURL := config.String("ORDER_URL", "http://order:8080")
	inventoryURL := config.String("INVENTORY_URL", "http://inventory:8080")

	a.Router.Handle("GET /{$}", "index", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = io.WriteString(w, indexHTML)
	})

	a.Router.HandlePlain("GET /.well-known/jwks.json", a.Metrics.Measure("jwks",
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			httpx.WriteJSON(w, http.StatusOK, issuer.JWKS())
		})))

	a.Router.Handle("POST /login", "login", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Username string `json:"username"`
		}
		if err := httpx.DecodeJSON(r, &req); err != nil || req.Username == "" {
			logins.WithLabelValues("bad_request").Inc()
			httpx.Error(w, http.StatusBadRequest, "username required")
			return
		}
		token, err := issuer.Mint(req.Username, "customer")
		if err != nil {
			logins.WithLabelValues("error").Inc()
			httpx.Error(w, http.StatusInternalServerError, "could not mint token")
			return
		}
		logins.WithLabelValues("success").Inc()
		httpx.WriteJSON(w, http.StatusOK, map[string]string{
			"access_token": token, "token_type": "Bearer",
		})
	})

	a.Router.Handle("GET /api/products", "products", func(w http.ResponseWriter, r *http.Request) {
		proxy(r.Context(), client, w, http.MethodGet, inventoryURL+"/inventory/items", "", nil)
	})

	a.Router.Handle("POST /api/checkout", "checkout", func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			checkouts.WithLabelValues("unauthorized").Inc()
			httpx.Error(w, http.StatusUnauthorized, "missing bearer token")
			return
		}
		body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		status := proxy(r.Context(), client, w, http.MethodPost, orderURL+"/orders", token, body)
		if status >= 200 && status < 300 {
			checkouts.WithLabelValues("success").Inc()
		} else {
			checkouts.WithLabelValues("failed").Inc()
		}
	})

	if err := a.Run(); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}

// proxy forwards a request to a downstream service and copies the response
// through, returning the downstream status code.
func proxy(ctx context.Context, client *http.Client, w http.ResponseWriter, method, url, token string, body []byte) int {
	var rdr io.Reader
	if body != nil {
		rdr = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, url, rdr)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "request build failed")
		return http.StatusInternalServerError
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", token)
	}
	resp, err := client.Do(req)
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, "downstream unavailable")
		return http.StatusBadGateway
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
	return resp.StatusCode
}
