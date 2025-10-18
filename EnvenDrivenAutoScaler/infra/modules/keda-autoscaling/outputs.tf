output "scaled_object" {
  value = kubernetes_scaled_object.backend_scaled_object.metadata[0].name
}