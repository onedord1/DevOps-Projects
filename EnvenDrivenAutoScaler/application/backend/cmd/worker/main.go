// backend/cmd/worker/main.go
package main

import (
    "encoding/json"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/streadway/amqp"

    "expense-tracker/internal/config"
    "expense-tracker/internal/database"
    "expense-tracker/internal/repositories"
    "expense-tracker/internal/services"
    "expense-tracker/internal/utils"
)

// MessageProcessor holds the dependencies for processing a message.
// This is a good practice for dependency injection and testing.
type MessageProcessor struct {
    // FIX 2: Use the concrete type instead of a non-existent interface.
    expenseService *services.ExpenseService
}

// processMessage contains the business logic for handling a single message from the queue.
// This is where you will add your specific logic.
func (mp *MessageProcessor) processMessage(body []byte) error {
    utils.Info("Processing message", utils.String("body", string(body)))

    // --- YOUR BUSINESS LOGIC GOES HERE ---
    //
    // Example: Unmarshal a JSON message and perform an action.
    // The structure of `TaskPayload` should match the JSON messages you publish.
    //
    type TaskPayload struct {
        Task   string      `json:"task"`
        UserID int         `json:"user_id"`
        Data   interface{} `json:"data"`
    }

    var payload TaskPayload
    if err := json.Unmarshal(body, &payload); err != nil {
        utils.Warn("Failed to unmarshal message body, discarding message", utils.ErrField(err))
        // We return nil here because the message is malformed and re-queuing it won't help.
        return nil
    }

    switch payload.Task {
    case "generate_report":
        // TODO: Implement report generation logic
        // You can use mp.expenseService here to interact with your database
        // e.g., report, err := mp.expenseService.GenerateReportForUser(payload.UserID)
        utils.Info("Executing 'generate_report' task", utils.Int("user_id", payload.UserID))
        time.Sleep(5 * time.Second) // Simulate work
        utils.Info("Successfully completed 'generate_report' task", utils.Int("user_id", payload.UserID))
        return nil
    case "send_welcome_email":
        // TODO: Implement email sending logic
        utils.Info("Executing 'send_welcome_email' task", utils.Int("user_id", payload.UserID))
        time.Sleep(2 * time.Second) // Simulate work
        utils.Info("Successfully completed 'send_welcome_email' task", utils.Int("user_id", payload.UserID))
        return nil
    default:
        utils.Warn("Received unknown task type", utils.String("task", payload.Task))
        // This is not a processing error, just an unknown task, so we can acknowledge it.
        return nil
    }
    // --- END OF YOUR BUSINESS LOGIC ---
}

func main() {
    utils.Info("Starting expense tracker worker")

    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("Failed to load config:", err)
    }

    // Connect to the database
    db, err := database.Connect(cfg)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer func() {
        if sqlDB, err := db.DB(); err == nil {
            sqlDB.Close()
        }
    }()

    // Initialize repositories and services
    transactionRepo := repositories.NewTransactionRepository(db)
    // Note: You might need to initialize other services like categoryRepo, tagRepo, etc.
    // For this example, we'll pass nil to the other dependencies of NewExpenseService.
    // Adjust this based on what your business logic requires.
    expenseService := services.NewExpenseService(transactionRepo, nil, nil, nil)

    // Create our message processor with its dependencies
    processor := &MessageProcessor{
        expenseService: expenseService,
    }

    // Connect to RabbitMQ
    rabbitmqURL := getRabbitMQURL(cfg)
    conn, err := amqp.Dial(rabbitmqURL)
    if err != nil {
        log.Fatalf("Failed to connect to RabbitMQ: %s", err)
    }
    defer conn.Close()

    ch, err := conn.Channel()
    if err != nil {
        log.Fatalf("Failed to open a channel: %s", err)
    }
    defer ch.Close()

    // Declare the queue to ensure it exists
    q, err := ch.QueueDeclare(
        "expense_processing_queue", // name
        true,                       // durable
        false,                      // delete when unused
        false,                      // exclusive
        false,                      // no-wait
        nil,                        // arguments
    )
    if err != nil {
        log.Fatalf("Failed to declare a queue: %s", err)
    }

    // Set QoS to only receive one message at a time.
    // This prevents a single fast worker from grabbing all messages
    // and ensures they are distributed among all available workers.
    err = ch.Qos(1, 0, false)
    if err != nil {
        log.Fatalf("Failed to set QoS: %s", err)
    }

    // Start consuming messages
    msgs, err := ch.Consume(
        q.Name, // queue
        "",     // consumer
        false,  // auto-ack (set to false for manual ack)
        false,  // exclusive
        false,  // no-local
        false,  // no-wait
        nil,    // args
    )
    if err != nil {
        log.Fatalf("Failed to register a consumer: %s", err)
    }

    utils.Info("Worker is now waiting for messages. To exit press CTRL+C")

    // Use a channel to wait for a shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    // Process messages in a separate goroutine
    go func() {
        for d := range msgs {
            // Process the message using our processor
            if err := processor.processMessage(d.Body); err != nil {
                // FIX 3: Use utils.Warn as utils.Error does not exist.
                utils.Warn("Failed to process message, re-queueing", utils.ErrField(err))
                // Negative acknowledgement: re-queue the message
                d.Nack(false, true)
            } else {
                utils.Info("Successfully processed message")
                // Positive acknowledgement: remove the message from the queue
                d.Ack(false)
            }
        }
    }()

    // Block until a shutdown signal is received
    <-quit
    utils.Info("Shutting down worker...")
}

// getRabbitMQURL constructs the RabbitMQ connection URL from the configuration.
func getRabbitMQURL(cfg *config.Config) string {
    return "amqp://" + cfg.RabbitMQ.User + ":" + cfg.RabbitMQ.Password + "@" + cfg.RabbitMQ.Host + ":" + cfg.RabbitMQ.Port + cfg.RabbitMQ.VHost
}