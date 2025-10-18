output "rabbitmq_helm_release" {
  value = helm_release.rabbitmq.name
}

output "rabbitmq_service" {
  value = "rabbitmq"
}

output "rabbitmq_namespace" {
  value = "rabbitmq"
}