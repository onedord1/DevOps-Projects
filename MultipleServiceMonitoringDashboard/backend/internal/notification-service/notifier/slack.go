package notifier

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"

    "github.com/your-org/monitoring-dashboard/internal/notification-service/model"
)

type SlackNotifier struct{}

type SlackPayload struct {
    Text     string       `json:"text"`
    Attachments []Attachment `json:"attachments"`
}

type Attachment struct {
    Color     string `json:"color"`
    Title     string `json:"title"`
    Text      string `json:"text"`
    Timestamp int64  `json:"ts"`
}

func (n *SlackNotifier) Send(ctx context.Context, channel *model.NotificationChannel, payload Payload) error {
    var config map[string]string
    if err := json.Unmarshal([]byte(channel.Config), &config); err != nil {
        return fmt.Errorf("failed to unmarshal slack config: %w", err)
    }

    webhookURL, ok := config["webhook_url"]
    if !ok {
        return fmt.Errorf("slack config missing 'webhook_url'")
    }

    // Build the Slack message
    color := "good"
    if payload.Alert.Status == "active" {
        color = "danger"
    }
    
    title := fmt.Sprintf("Alert: %s", payload.Alert.Severity)
    if payload.Alert.Status == "resolved" {
        title = "Resolved: " + title
    }

    // In a real app, you'd use a template engine like `text/template`
    body := fmt.Sprintf("Monitor: %v\nCurrent Value: %f", payload.Monitor["name"], payload.Alert.CurrentValue)

    slackPayload := SlackPayload{
        Text: title,
        Attachments: []Attachment{
            {
                Color:     color,
                Title:     title,
                Text:      body,
                Timestamp: payload.Alert.TriggeredAt.Unix(),
            },
        },
    }

    jsonBody, _ := json.Marshal(slackPayload)
    req, _ := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewBuffer(jsonBody))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("slack webhook returned status %d", resp.StatusCode)
    }

    return nil
}