# Module: `eks`

Amazon EKS cluster for the Acme platform, wrapping [`terraform-aws-modules/eks/aws`](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws) (`~> 21.0`) and standardizing on **EKS Auto Mode** (AWS-managed compute).

## Usage

```hcl
module "eks" {
  source = "../../modules/eks"

  name                   = "acme-platform-dev"
  kubernetes_version     = "1.33"
  vpc_id                 = module.network.vpc_id
  subnet_ids             = module.network.private_subnet_ids
  endpoint_public_access = true            # false for prod
  tags                   = local.tags
}
```

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | — | Cluster name |
| `kubernetes_version` | string | `1.33` | Control-plane version |
| `vpc_id` | string | — | Target VPC |
| `subnet_ids` | list(string) | — | Private subnets for nodes/ENIs |
| `endpoint_public_access` | bool | `false` | Public API endpoint |
| `enable_cluster_creator_admin_permissions` | bool | `true` | Grant Terraform identity admin |
| `node_pools` | list(string) | `["general-purpose","system"]` | Auto Mode pools |
| `tags` | map(string) | `{}` | Tags |

## Outputs

`cluster_name`, `cluster_endpoint`, `cluster_certificate_authority_data`, `cluster_security_group_id`, `oidc_provider_arn`, `kubeconfig_command`.

> **IRSA / Pod Identity:** `oidc_provider_arn` is exported so workload identity (IRSA) or EKS Pod Identity associations can be wired in later phases for components like the Gateway controller and external-secrets.
