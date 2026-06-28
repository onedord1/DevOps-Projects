# Module: `ecr`

One Amazon ECR repository per Acme service, using native `aws_ecr_repository` resources (no upstream dependency for this small, well-understood surface).

Defaults are supply-chain friendly: **immutable tags**, **scan-on-push**, **AES256 encryption**, and a **lifecycle policy** retaining the most recent images.

## Usage

```hcl
module "ecr" {
  source = "../../modules/ecr"

  repositories    = ["acme-platform/frontend", "acme-platform/payment", "acme-platform/order"]
  max_image_count = 30
  tags            = local.tags
}
```

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `repositories` | list(string) | — | Repository names (one per service) |
| `image_tag_mutability` | string | `IMMUTABLE` | `IMMUTABLE` or `MUTABLE` |
| `scan_on_push` | bool | `true` | Enable native vulnerability scanning |
| `max_image_count` | number | `30` | Images retained per repo |
| `force_delete` | bool | `false` | Allow deleting non-empty repos |
| `tags` | map(string) | `{}` | Tags |

## Outputs

`repository_urls` (map name→URL), `repository_arns` (map name→ARN).
