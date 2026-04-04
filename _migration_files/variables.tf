# ============================================================================
# Clarity Infrastructure — Variable Definitions
# ============================================================================
# These are the "knobs" for your infrastructure. You set values in
# terraform.tfvars (which is .gitignored) and Terraform injects them
# into your resource definitions.
# ============================================================================

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (production, staging)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Environment must be 'production' or 'staging'."
  }
}

# ── Secrets (passed via terraform.tfvars or CI/CD env vars) ──

variable "gemini_api_key" {
  description = "Google Gemini AI API key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret API key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

variable "firebase_project_id" {
  description = "Firebase project ID (may differ from GCP project)"
  type        = string
}

# ── Scaling Configuration ──

variable "max_instances" {
  description = "Maximum Cloud Run instances (cost ceiling)"
  type        = number
  default     = 10
}

variable "min_instances" {
  description = "Minimum Cloud Run instances (0 = scale to zero)"
  type        = number
  default     = 0
}
