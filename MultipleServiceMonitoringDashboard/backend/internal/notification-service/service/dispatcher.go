package service

import (
    "context"
    "encoding/json"
    "log"
    "time"

    "github.com/google/uuid"
    "github.com/nats-io/nats.go"

    alertmodel "github.com/your-org/monitoring-dashboard/internal/alerting-service/model" // Use an alias
    "github.com/your-org/monitoring-dashboard/internal/notification-service/model"
    "github.com/your-org/monitoring-dashboard/internal/notification-service/notifier"
    "github.com/your-org/monitoring-dashboard/internal/notification-service/repository"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

type Dispatcher struct {
    repo     repository.NotificationRepository
    eventBus events.EventBus
}

func NewDispatcher(repo repository.NotificationRepository, eventBus events.EventBus) *Dispatcher {
    return &Dispatcher{repo: repo, eventBus: eventBus}
}

// StartEventListener subscribes to alert events and dispatches notifications
func (d *Dispatcher) StartEventListener() {
    log.Println("Starting notification event listener...")
    d.eventBus.Subscribe("alert.triggered", d.handleAlertEvent)
    d.eventBus.Subscribe("alert.resolved", d.handleAlertEvent)
}

func (d *Dispatcher) handleAlertEvent(msg *nats.Msg) {
    var alertInstance alertmodel.AlertInstance // Use the alias here
    if err := json.Unmarshal(msg.Data, &alertInstance); err != nil {
        log.Printf("Failed to unmarshal alert instance for notification: %v", err)
        return
    }

    // Run in a goroutine to not block the event loop
    go d.ProcessAlert(context.Background(), &alertInstance, msg.Subject)
}

func (d *Dispatcher) ProcessAlert(ctx context.Context, alert *alertmodel.AlertInstance, eventType string) { // Use the alias here
    // 1. Fetch all enabled channels
    channels, err := d.repo.GetEnabledChannels(ctx)
    if err != nil {
        log.Printf("Failed to get notification channels: %v", err)
        return
    }

    // 2. Fetch the template for this event type
    tmpl, err := d.repo.GetTemplateByType(ctx, eventType)
    if err != nil {
        log.Printf("Failed to get notification template for %s: %v", eventType, err)
        return
    }

    // 3. Prepare payload (in a real app, fetch monitor details from Config Service)
    payload := notifier.Payload{
        Alert:   alert,
        Monitor: map[string]interface{}{"name": "example-monitor"}, // Placeholder
    }

    // 4. Send notification for each channel
    for _, channel := range channels {
        go d.sendForChannel(ctx, channel, tmpl, payload, alert.ID, eventType)
    }
}

func (d *Dispatcher) sendForChannel(ctx context.Context, channel *model.NotificationChannel, tmpl *model.NotificationTemplate, payload notifier.Payload, eventID uuid.UUID, eventType string) {
    log.Printf("Sending notification for event %s via channel %s (%s)", eventID, channel.Name, channel.Type)

    // Create a record of this attempt
    record := &model.NotificationRecord{
        ID:        uuid.New(),
        EventID:   eventID,
        ChannelID: channel.ID,
        EventType: eventType,
        Status:    "pending",
    }

    // Defer creating the record to capture the final status
    defer func() {
        if err := d.repo.CreateRecord(ctx, record); err != nil {
            log.Printf("Failed to create notification record: %v", err)
        }
    }()

    // Get the correct notifier for this channel type
    notifierImpl, err := notifier.NewNotifier(channel.Type)
    if err != nil {
        log.Printf("Failed to create notifier for channel %s: %v", channel.Type, err)
        record.Status = "failed"
        errMsg := err.Error()
        record.ErrorMessage = &errMsg
        return
    }

    // Send the notification
    if err := notifierImpl.Send(ctx, channel, payload); err != nil {
        log.Printf("Failed to send notification via %s: %v", channel.Type, err)
        record.Status = "failed"
        errMsg := err.Error()
        record.ErrorMessage = &errMsg
        return
    }

    // Success!
    log.Printf("Successfully sent notification via %s", channel.Type)
    record.Status = "sent"
    now := time.Now()
    record.SentAt = &now
}