terraform {
  backend "s3" {
    bucket         = "shopsmart-terraform-state-699475925713" # Use your bucket name
    key            = "global/terraform.tfstate"
    region         = "ap-south-1" # Use your primary region
    dynamodb_table = "shopsmart-terraform-locks" # Use your table name
    encrypt        = true
  }
}