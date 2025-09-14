output "Update_Kubeconfig" {
  value = format("aws eks update-kubeconfig --region %s --name %s", var.aws_region, var.cluster_name)

}