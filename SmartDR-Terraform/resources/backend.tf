terraform {
  backend "s3" {
    bucket         = "shopsmart-terraform-state-699475925713" # Use bucket name that created on bootstrape
    key            = "global/terraform.tfstate"
    region         = "ap-south-1" # Use primary region
    dynamodb_table = "shopsmart-terraform-locks" # Use dynammodb table name while bootstapping
    encrypt        = true
  }
}