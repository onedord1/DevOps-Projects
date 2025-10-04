package events

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/nats-io/nats.go"
)

type EventBus interface {
    Publish(subject string, data interface{}) error
    Subscribe(subject string, handler func(msg *nats.Msg)) error
    Close()
}

type NATSEventBus struct {
    Conn *nats.Conn
}

func NewNATSEventBus(url string) (*NATSEventBus, error) {
    nc, err := nats.Connect(url)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to NATS: %w", err)
    }
    log.Println("Successfully connected to NATS!")
    return &NATSEventBus{Conn: nc}, nil
}

func (bus *NATSEventBus) Publish(subject string, data interface{}) error {
    jsonData, err := json.Marshal(data)
    if err != nil {
        return fmt.Errorf("failed to marshal data: %w", err)
    }
    return bus.Conn.Publish(subject, jsonData)
}

func (bus *NATSEventBus) Subscribe(subject string, handler func(msg *nats.Msg)) error {
    _, err := bus.Conn.Subscribe(subject, handler)
    return err
}

func (bus *NATSEventBus) Close() {
    bus.Conn.Close()
}