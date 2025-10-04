package notifier

import (
    "context"
    "fmt"

    alertmodel "github.com/your-org/monitoring-dashboard/internal/alerting-service/model" // Use an alias
    "github.com/your-org/monitoring-dashboard/internal/notification-service/model"
)

// Payload is the data structure passed to the template engine
type Payload struct {
    Alert  *alertmodel.AlertInstance `json:"alert"` // Use the alias here
    Monitor map[string]interface{}   `json:"monitor"` // Simplified monitor data
}

type Notifier interface {
    Send(ctx context.Context, channel *model.NotificationChannel, payload Payload) error
}

func NewNotifier(channelType string) (Notifier, error) {
    switch channelType {
    case "slack":
        return &SlackNotifier{}, nil
    case "webhook":
        return &WebhookNotifier{}, nil
    // case "email":
    // 	return &EmailNotifier{}, nil
    default:
        return nil, fmt.Errorf("unsupported channel type: %s", channelType)
    }
}