// Package events is a thin wrapper over NATS JetStream for durable, at-least-
// once event delivery between services. NATS was chosen as the broker for its
// tiny footprint and single-binary operation (ADR-0007).
//
// The wrapper is intentionally tolerant: when NATS_URL is empty the Bus is a
// no-op, so services run in environments without a broker (e.g. unit runs)
// while behaving fully when connected.
package events

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// Subjects used across the platform.
const (
	StreamOrders        = "ORDERS"
	SubjectOrderCreated = "order.created"
	SubjectOrderFailed  = "order.failed"
)

// Bus is a JetStream connection. A nil-connection Bus is a valid no-op.
type Bus struct {
	nc     *nats.Conn
	js     jetstream.JetStream
	logger *slog.Logger
}

// Connect dials NATS and initializes JetStream. If url is empty, it returns a
// no-op Bus (Enabled() == false).
func Connect(url string, logger *slog.Logger) (*Bus, error) {
	if url == "" {
		logger.Info("events disabled: NATS_URL not set")
		return &Bus{logger: logger}, nil
	}
	nc, err := nats.Connect(url,
		nats.Name("acme-platform"),
		nats.MaxReconnects(-1),
		nats.ReconnectWait(time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("connect nats: %w", err)
	}
	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("init jetstream: %w", err)
	}
	logger.Info("events connected", slog.String("url", url))
	return &Bus{nc: nc, js: js, logger: logger}, nil
}

// Enabled reports whether the bus is backed by a real connection.
func (b *Bus) Enabled() bool { return b != nil && b.js != nil }

// Close drains the underlying connection.
func (b *Bus) Close() {
	if b != nil && b.nc != nil {
		_ = b.nc.Drain()
	}
}

// Ready is a health.Check verifying the connection is established.
func (b *Bus) Ready(context.Context) error {
	if !b.Enabled() {
		return nil // disabled is not unhealthy
	}
	if b.nc.Status() != nats.CONNECTED {
		return errors.New("nats not connected")
	}
	return nil
}

// EnsureStream creates or updates a stream covering the given subjects.
func (b *Bus) EnsureStream(ctx context.Context, name string, subjects ...string) error {
	if !b.Enabled() {
		return nil
	}
	_, err := b.js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:      name,
		Subjects:  subjects,
		Retention: jetstream.WorkQueuePolicy,
		MaxAge:    24 * time.Hour,
	})
	return err
}

// Publish marshals v to JSON and publishes it to subject.
func (b *Bus) Publish(ctx context.Context, subject string, v any) error {
	if !b.Enabled() {
		b.logger.Debug("publish skipped (events disabled)", slog.String("subject", subject))
		return nil
	}
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	_, err = b.js.Publish(ctx, subject, data)
	return err
}

// Handler processes a decoded message body.
type Handler func(ctx context.Context, subject string, data []byte) error

// Consume creates a durable consumer on stream/subject and dispatches messages
// to handler. It blocks until ctx is cancelled.
func (b *Bus) Consume(ctx context.Context, stream, subject, durable string, handler Handler) error {
	if !b.Enabled() {
		return errors.New("cannot consume: events disabled")
	}
	s, err := b.js.Stream(ctx, stream)
	if err != nil {
		return fmt.Errorf("lookup stream %s: %w", stream, err)
	}
	cons, err := s.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Durable:       durable,
		FilterSubject: subject,
		AckPolicy:     jetstream.AckExplicitPolicy,
		MaxDeliver:    5,
	})
	if err != nil {
		return fmt.Errorf("create consumer %s: %w", durable, err)
	}

	cc, err := cons.Consume(func(msg jetstream.Msg) {
		if err := handler(ctx, msg.Subject(), msg.Data()); err != nil {
			b.logger.Error("message handler failed",
				slog.String("subject", msg.Subject()), slog.Any("error", err))
			_ = msg.Nak()
			return
		}
		_ = msg.Ack()
	})
	if err != nil {
		return fmt.Errorf("start consume: %w", err)
	}
	defer cc.Stop()

	<-ctx.Done()
	return nil
}
