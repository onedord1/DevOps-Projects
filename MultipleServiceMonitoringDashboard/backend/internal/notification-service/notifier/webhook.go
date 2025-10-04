package notifier

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"

    "github.com/your-org/monitoring-dashboard/internal/notification-service/model"
)

type WebhookNotifier struct{}

func (n *WebhookNotifier) Send(ctx context.Context, channel *model.NotificationChannel, payload Payload) error {
    var config map[string]string
    if err := json.Unmarshal([]byte(channel.Config), &config); err != nil {
        return fmt.Errorf("failed to unmarshal webhook config: %w", err)
    }

    webhookURL, ok := config["webhook_url"]
    if !ok {
        return fmt.Errorf("webhook config missing 'webhook_url'")
    }

    jsonBody, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("failed to marshal webhook payload: %w", err)
    }

    req, _ := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewBuffer(jsonBody))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("webhook returned status %d", resp.StatusCode)
    }

    return nil
}