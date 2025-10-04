package service

import (
    "context"
    "encoding/json"
    "log"
    "time"

    "github.com/google/uuid"
    "github.com/nats-io/nats.go"

    alertmodel "github.com/your-org/monitoring-dashboard/internal/alerting-service/model" // Use an alias
    "github.com/your-org/monitoring-dashboard/internal/incident-service/model"
    "github.com/your-org/monitoring-dashboard/internal/incident-service/repository"
    "github.com/your-org/monitoring-dashboard/pkg/events"
)

type IncidentManager struct {
    repo     repository.IncidentRepository
    eventBus events.EventBus
}

func NewIncidentManager(repo repository.IncidentRepository, eventBus events.EventBus) *IncidentManager {
    return &IncidentManager{repo: repo, eventBus: eventBus}
}

// StartEventListener subscribes to alert events
func (im *IncidentManager) StartEventListener() {
    log.Println("Starting incident event listener...")
    im.eventBus.Subscribe("alert.triggered", im.handleAlertTriggered)
    im.eventBus.Subscribe("alert.resolved", im.handleAlertResolved)
}

func (im *IncidentManager) handleAlertTriggered(msg *nats.Msg) {
    var alert alertmodel.AlertInstance // Use the alias here
    if err := json.Unmarshal(msg.Data, &alert); err != nil {
        log.Printf("Failed to unmarshal alert for incident service: %v", err)
        return
    }

    // Only create incidents for critical alerts
    if alert.Severity != "critical" {
        return
    }

    // Check if an open incident already exists for this monitor
    // This is a simplified check. A real system might be more sophisticated.
    openIncidents, _ := im.repo.GetAllIncidents(context.Background(), "open")
    for _, inc := range openIncidents {
        // Simple check: if an incident is already linked to this monitor, don't create a new one.
        // A better check would be to see if any related_alert_ids match.
        if contains(inc.RelatedAlertIDs, alert.ID) {
            log.Printf("Open incident already exists for monitor %s", alert.MonitorID)
            return
        }
    }

    // Create a new incident
    incident := &model.Incident{
        ID:              uuid.New(),
        Title:           "Critical Alert: " + alert.MonitorID.String(), // Improve title
        Description:     "Automatically created from critical alert.",
        Status:          "open",
        Severity:        alert.Severity,
        CreatedAt:       time.Now(),
        RelatedAlertIDs: []uuid.UUID{alert.ID},
    }

    if err := im.repo.CreateIncident(context.Background(), incident); err != nil {
        log.Printf("Failed to create incident: %v", err)
        return
    }

    // Add event to timeline
    event := &model.IncidentEvent{
        ID:         uuid.New(),
        IncidentID: incident.ID,
        EventType:  "alert.triggered",
        Payload:    string(msg.Data),
    }
    im.repo.AddEvent(context.Background(), event)

    log.Printf("Created new incident %s for alert %s", incident.ID, alert.ID)
}

func (im *IncidentManager) handleAlertResolved(msg *nats.Msg) {
    var alert alertmodel.AlertInstance // Use the alias here
    if err := json.Unmarshal(msg.Data, &alert); err != nil {
        log.Printf("Failed to unmarshal resolved alert for incident service: %v", err)
        return
    }

    // Find open incidents related to this alert
    openIncidents, _ := im.repo.GetAllIncidents(context.Background(), "open")
    for _, inc := range openIncidents {
        if contains(inc.RelatedAlertIDs, alert.ID) {
            // Add resolution event to timeline
            event := &model.IncidentEvent{
                ID:         uuid.New(),
                IncidentID: inc.ID,
                EventType:  "alert.resolved",
                Payload:    string(msg.Data),
            }
            im.repo.AddEvent(context.Background(), event)

            // For simplicity, we won't auto-resolve the incident.
            // A real system might resolve if all related alerts are resolved.
            log.Printf("Added resolved alert event to incident %s", inc.ID)
        }
    }
}

func contains(slice []uuid.UUID, item uuid.UUID) bool {
    for _, s := range slice {
        if s == item {
            return true
        }
    }
    return false
}