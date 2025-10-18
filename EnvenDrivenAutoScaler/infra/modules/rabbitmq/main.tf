resource "helm_release" "rabbitmq" {
  name       = "rabbitmq"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "rabbitmq"
  namespace  = "rabbitmq"
  version    = "16.0.14"

  create_namespace = true

  values = [
    <<-EOT
    auth:
      username: expenseuser
      password: expensenPassword1234
    persistence:
      enabled: true
      size: 8Gi
    service:
      type: ClusterIP
    EOT
  ]
}