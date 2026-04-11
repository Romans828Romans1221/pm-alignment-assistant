# ============================================================================
# Clarity Infrastructure — Main Configuration
# ============================================================================
# This file declares the full GCP infrastructure stack:
#   1. Required API services
#   2. Artifact Registry (Docker image storage)
#   3. Secret Manager (secure credential storage)
#   4. Cloud Run (containerized application hosting)
#   5. IAM (access control)
#
# Why Secret Manager instead of plain env vars?
#   - Env vars in Cloud Run are visible to anyone with `gcloud run describe`
#   - Secret Manager encrypts at rest, audits access, and supports rotation
#   - This is how production systems handle credentials
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Uncomment to use remote state (recommended for teams):
  # backend "gcs" {
  #   bucket = "clarity-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Local values for consistent naming ──
locals {
  service_name = "clarity-api"
  labels = {
    app         = "clarity"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# ============================================================================
# 1. Enable Required GCP APIs
# ============================================================================

resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])

  service            = each.key
  disable_on_destroy = false
}

# ============================================================================
# 2. Artifact Registry — Docker Image Storage
# ============================================================================

resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "clarity-backend"
  description   = "Docker images for the Clarity API"
  format        = "DOCKER"
  labels        = local.labels

  # Automatically clean up untagged images older than 30 days
  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "2592000s"  # 30 days
    }
  }

  depends_on = [google_project_service.required_apis]
}

# ============================================================================
# 3. Secret Manager — Secure Credential Storage
# ============================================================================
# Pattern: For each secret, we create a Secret resource and a SecretVersion
# containing the actual value. Cloud Run references these by secret ID.

resource "google_secret_manager_secret" "gemini_key" {
  secret_id = "clarity-gemini-api-key"
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "gemini_key_value" {
  secret      = google_secret_manager_secret.gemini_key.id
  secret_data = var.gemini_api_key
}

resource "google_secret_manager_secret" "stripe_key" {
  secret_id = "clarity-stripe-secret-key"
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "stripe_key_value" {
  secret      = google_secret_manager_secret.stripe_key.id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret" "stripe_webhook" {
  secret_id = "clarity-stripe-webhook-secret"
  labels    = local.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "stripe_webhook_value" {
  secret      = google_secret_manager_secret.stripe_webhook.id
  secret_data = var.stripe_webhook_secret
}

# ============================================================================
# 4. Cloud Run Service Account
# ============================================================================
# Instead of using the default Compute Engine SA (which has way too many
# permissions), we create a dedicated service account with only what's needed.

resource "google_service_account" "clarity_runner" {
  account_id   = "clarity-api-runner"
  display_name = "Clarity API Cloud Run Runner"
  description  = "Least-privilege SA for the Clarity Cloud Run service"
}

# Grant the SA permission to read secrets
resource "google_secret_manager_secret_iam_member" "gemini_access" {
  secret_id = google_secret_manager_secret.gemini_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.clarity_runner.email}"
}

resource "google_secret_manager_secret_iam_member" "stripe_access" {
  secret_id = google_secret_manager_secret.stripe_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.clarity_runner.email}"
}

resource "google_secret_manager_secret_iam_member" "stripe_webhook_access" {
  secret_id = google_secret_manager_secret.stripe_webhook.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.clarity_runner.email}"
}

# Grant the SA permission to write logs
resource "google_project_iam_member" "log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.clarity_runner.email}"
}

# ============================================================================
# 5. Cloud Run Service
# ============================================================================

resource "google_cloud_run_v2_service" "api_service" {
  name     = local.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = local.labels

  template {
    service_account = google_service_account.clarity_runner.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/clarity-backend/clarity-backend:latest"

      # ── Resource Limits ──
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true   # Scale down CPU when idle (cost savings)
        startup_cpu_boost = true   # Extra CPU during cold start
      }

      # ── Non-sensitive Environment Variables ──
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.firebase_project_id
      }

      # ── Secrets (injected from Secret Manager) ──
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "STRIPE_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.stripe_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "STRIPE_WEBHOOK_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.stripe_webhook.secret_id
            version = "latest"
          }
        }
      }

      # ── Health Probes ──
      startup_probe {
        http_get {
          path = "/api/v1/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/v1/health"
        }
        period_seconds = 30
      }
    }
  }

  # Ensure traffic shifts to new revision only after it passes health checks
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.gemini_key_value,
    google_secret_manager_secret_version.stripe_key_value,
    google_secret_manager_secret_version.stripe_webhook_value,
  ]
}

# ============================================================================
# 6. Public Access (allow unauthenticated requests to the API)
# ============================================================================

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_cloud_run_v2_service.api_service.project
  location = google_cloud_run_v2_service.api_service.location
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
