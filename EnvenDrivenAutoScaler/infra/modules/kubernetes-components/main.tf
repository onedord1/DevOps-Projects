data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

# Install AWS Load Balancer Controller
resource "kubernetes_service_account" "alb_controller" {
  metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = var.alb_controller_role_arn
    }
  }
}

resource "helm_release" "alb_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.14.1"

  values = [
    <<-EOT
    clusterName: ${var.cluster_name}
    serviceAccount:
      create: false
      name: aws-load-balancer-controller
    region: ${var.region}
    vpcId: ${data.aws_eks_cluster.cluster.vpc_config[0].vpc_id}
    EOT
  ]

  depends_on = [
    kubernetes_service_account.alb_controller
  ]
}

# Install KEDA
resource "helm_release" "keda" {
  name       = "keda"
  repository = "https://kedacore.github.io/charts"
  chart      = "keda"
  namespace  = "keda"
  version    = "2.18.0"

  create_namespace = true

  values = [
    <<-EOT
    metricsServer:
      apiServer:
        create: true
    EOT
  ]
}

# Install Velero
resource "kubernetes_namespace" "velero" {
  metadata {
    name = "velero"
  }
}

resource "kubernetes_service_account" "velero" {
  metadata {
    name      = "velero"
    namespace = kubernetes_namespace.velero.metadata[0].name
    annotations = {
      "eks.amazonaws.com/role-arn" = var.velero_role_arn
    }
  }
}

resource "helm_release" "velero" {
  name       = "velero"
  repository = "https://vmware-tanzu.github.io/helm-charts"
  chart      = "velero"
  namespace  = kubernetes_namespace.velero.metadata[0].name
  version    = "11.1.1"

  values = [
    <<-EOT
    configuration:
      provider: aws
      backupStorageLocation:
        name: default
        bucket: ${var.velero_backup_bucket_name}
        config:
          region: ${var.region}
      volumeSnapshotLocation:
        name: default
        config:
          region: ${var.region}
    serviceAccount:
      server:
        create: false
        name: velero
    EOT
  ]

  depends_on = [
    kubernetes_service_account.velero
  ]
}