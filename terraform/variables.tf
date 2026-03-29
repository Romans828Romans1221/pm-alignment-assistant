variable "project_id" {
  description = "Your Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy to"
  type        = string
  default     = "us-central1"
}