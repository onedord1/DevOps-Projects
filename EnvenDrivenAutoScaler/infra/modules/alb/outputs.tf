output "alb_controller_policy_arn" {
  description = "The ARN of the IAM policy for the ALB Controller."
  value       = aws_iam_policy.alb_controller.arn
}