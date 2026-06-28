// Command notification consumes order events from NATS JetStream and "sends"
// customer notifications. It demonstrates the asynchronous, event-driven edge
// of the platform. Business metric: notifications_sent_total{channel}.
package main

import (
	"context"
	"encoding/json"

	"github.com/acme-commerce/platform/pkg/app"
	"github.com/acme-commerce/platform/pkg/config"
	"github.com/acme-commerce/platform/pkg/events"
	"github.com/prometheus/client_golang/prometheus"
)

func main() {
	a := app.New("notification")

	sent := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "notifications_sent_total",
		Help: "Notifications dispatched by channel.",
	}, []string{"channel"})
	a.Metrics.Registry.MustRegister(sent)

	bus, err := events.Connect(config.String("NATS_URL", ""), a.Logger)
	if err != nil {
		a.Logger.Error("events connect failed", "error", err)
		return
	}
	defer bus.Close()
	a.Health.Register("nats", bus.Ready)

	channel := config.String("NOTIFY_CHANNEL", "email")

	handler := func(ctx context.Context, subject string, data []byte) error {
		var order struct {
			OrderID    string `json:"order_id"`
			TotalCents int    `json:"total_cents"`
		}
		if err := json.Unmarshal(data, &order); err != nil {
			return err
		}
		a.Logger.Info("notification sent",
			"channel", channel,
			"order_id", order.OrderID,
			"total_cents", order.TotalCents,
		)
		sent.WithLabelValues(channel).Inc()
		return nil
	}

	// Only run the consumer when a broker is configured; otherwise the service
	// still serves /healthz and /metrics so it deploys cleanly everywhere.
	var workers []app.Worker
	if bus.Enabled() {
		if err := bus.EnsureStream(context.Background(), events.StreamOrders, "order.>"); err != nil {
			a.Logger.Warn("ensure stream failed", "error", err)
		}
		workers = append(workers, func(ctx context.Context) error {
			a.Logger.Info("consuming order events", "subject", events.SubjectOrderCreated)
			return bus.Consume(ctx, events.StreamOrders, events.SubjectOrderCreated, "notification", handler)
		})
	} else {
		a.Logger.Warn("NATS_URL not set; notification consumer disabled")
	}

	if err := a.Run(workers...); err != nil {
		a.Logger.Error("service exited with error", "error", err)
	}
}
