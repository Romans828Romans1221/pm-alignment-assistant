# ============================================================================
# Clarity Infrastructure — Outputs
# ============================================================================
# After `terraform apply`, these values are printed to the console.
# They're also accessible programmatically via `terraform output -json`.
# ============================================================================

output "service_url" {
  description = "The public URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.api_service.uri
}

output "artifact_registry_url" {
  description = "The Docker registry URL for pushing images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend_repo.repository_id}"
}

output "service_account_email" {
  description = "The email of the Cloud Run service account"
  value       = google_service_account.clarity_runner.email
}
