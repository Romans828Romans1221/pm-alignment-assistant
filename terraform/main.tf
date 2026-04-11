terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Required Google APIs Automatically
resource "google_project_service" "cloudrun_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# 2. Create a Docker Repository for the Backend
resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "clarity-backend"
  description   = "Docker repository for the Clarity API"
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry_api]
}

# 3. Create the Cloud Run Service
resource "google_cloud_run_v2_service" "api_service" {
  name     = "clarity-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      # We use a standard Google "hello" image just to get the server online the first time.
      # We will replace this with your actual app container in the next step.
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  depends_on = [google_project_service.cloudrun_api]
}

# 4. Make the API publicly accessible so the React frontend can talk to it
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_cloud_run_v2_service.api_service.project
  location = google_cloud_run_v2_service.api_service.location
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}