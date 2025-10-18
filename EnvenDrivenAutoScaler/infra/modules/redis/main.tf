resource "helm_release" "redis" {
  name       = "redis"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "redis"
  namespace  = "redis"
  version    = "23.1.3"

  create_namespace = true

  values = [
    <<-EOT
    auth:
      password: expenseRedis1234
    master:
      persistence:
        enabled: true
        size: 8Gi
    service:
      type: ClusterIP
    EOT
  ]
}