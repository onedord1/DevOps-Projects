resource "kubernetes_secret" "rabbitmq_trigger_auth" {
  metadata {
    name      = "rabbitmq-trigger-auth"
    namespace = "expense-tracker"
  }

  data = {
    host     = "rabbitmq.rabbitmq.svc.cluster.local"
    port     = "5672"
    username = "user"
    password = "password"
  }
}

# Create ScaledObject for backend application
resource "kubernetes_scaled_object" "backend_scaled_object" {
  metadata {
    name      = "expense-tracker-be-scaled-object"
    namespace = "expense-tracker"
  }

  spec {
    scale_target_ref {
      name = "dev-expense-tracker-be"
    }

    min_replica_count = 1
    max_replica_count = 10

    triggers {
      type = "rabbitmq"
      metadata = {
        queueLength    = "20"
        queueName      = "expense-queue"
        host           = "rabbitmq.rabbitmq.svc.cluster.local"
        protocol       = "amqp"
        operation      = "getMessages"
        unackedState   = "true"
      }
      authentication_ref {
        name = "rabbitmq-trigger-auth"
        kind = "TriggerAuthentication"
      }
    }
  }

  depends_on = [
    kubernetes_secret.rabbitmq_trigger_auth
  ]
}