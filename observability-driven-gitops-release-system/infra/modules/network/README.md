# Module: `network`

Opinionated VPC for the Acme platform, wrapping [`terraform-aws-modules/vpc/aws`](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws) (`~> 6.6`).

It computes private/public subnets across `az_count` AZs, provisions NAT egress (single or per-AZ), and applies the Kubernetes load-balancer subnet tags so EKS and the Gateway controller place load balancers correctly.

## Usage

```hcl
module "network" {
  source = "../../modules/network"

  name               = "acme-platform-dev"
  cidr               = "10.10.0.0/16"
  az_count           = 2
  single_nat_gateway = true            # cheap for dev; false for prod (HA)
  cluster_name       = "acme-platform-dev"
  tags               = { Project = "acme-platform", Environment = "dev" }
}
```

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | — | Name prefix for resources |
| `cidr` | string | `10.0.0.0/16` | VPC IPv4 CIDR |
| `az_count` | number | `3` | AZs to span (2–4) |
| `single_nat_gateway` | bool | `false` | One shared NAT vs per-AZ |
| `cluster_name` | string | `""` | Adds EKS cluster discovery subnet tag |
| `tags` | map(string) | `{}` | Tags on all resources |

## Outputs

`vpc_id`, `vpc_cidr_block`, `private_subnet_ids`, `public_subnet_ids`, `azs`, `nat_public_ips`.
