output "cluster_name" {
  value = aws_eks_cluster.cluster.name
}
output "cluster_oidc_issuer_url" {
  value = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}