output "redis_helm_release" {
  value = helm_release.redis.name
}

output "redis_service" {
  value = "redis-master"
}

output "redis_namespace" {
  value = "redis"
}