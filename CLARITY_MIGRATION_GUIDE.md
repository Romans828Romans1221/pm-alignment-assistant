# Clarity Infrastructure Migration Guide
## Side-by-Side Code Review + Safe Integration Steps

---

# Table of Contents

1. [Migration Strategy Overview](#1-migration-strategy-overview)
2. [File 1: Dockerfile](#2-file-1-dockerfile)
3. [File 2: terraform/main.tf](#3-file-2-terraformmaintf)
4. [File 3: tsconfig.json](#4-file-3-tsconfigjson)
5. [File 4: index.ts (Server Entry Point)](#5-file-4-indexts-server-entry-point)
6. [File 5: src/routes/team.ts](#6-file-5-srcroutesteamts)
7. [File 6: src/routes/payment.ts](#7-file-6-srcroutespaymentts)
8. [NEW Files (No Original Exists)](#8-new-files-no-original-exists)
9. [Frontend Config Update](#9-frontend-config-update)
10. [Claude Code Integration Commands](#10-claude-code-integration-commands)
11. [Verification Checklist](#11-verification-checklist)

---

# 1. Migration Strategy Overview

## The Golden Rule
**Never change what you don't understand.** Every change in this document is explained with:
- The ORIGINAL code (what you have now)
- The NEW code (what you're replacing it with)
- A line-by-line explanation of WHAT changed and WHY

## Branch Strategy
```bash
# Step 1: Make sure you're on main and it's clean
git status
git stash  # if you have uncommitted changes

# Step 2: Create the feature branch
git checkout -b infra/phase-1-devops

# Step 3: After ALL changes are integrated and tested
git add -A
git commit -m "infra: phase 1 devops overhaul"

# Step 4: Only merge when everything works
git checkout main
git merge infra/phase-1-devops
```

## Commit Order (lowest risk → highest risk)
```
Commit 1: .gitignore + .dockerignore          (zero risk — new files only)
Commit 2: terraform/* files                    (dormant until you run apply)
Commit 3: Dockerfile                           (test locally before pushing)
Commit 4: tsconfig.json                        (incremental strict mode)
Commit 5: index.ts + routes                    (has backward compat redirect)
Commit 6: .github/workflows/deploy.yml         (dormant until push to main)
```

---

# 2. File 1: Dockerfile

## ORIGINAL (Your Current Code)
```dockerfile
# --- STAGE 1: Build ---
FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:backend
RUN npm run build

# --- STAGE 2: Production ---
FROM node:20-slim
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

ENTRYPOINT ["node", "build/index.js"]
```

## NEW (Replacement)
```dockerfile
# --- STAGE 1: Build ---
FROM node:20-alpine AS builder
ARG BUILD_SHA=local
ARG BUILD_TIME=unknown
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:backend
RUN npm run build
RUN echo "{\"sha\":\"${BUILD_SHA}\",\"time\":\"${BUILD_TIME}\"}" > build-info.json

# --- STAGE 2: Production ---
FROM node:20-alpine AS production
RUN addgroup -S clarity && adduser -S clarity -G clarity
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/build ./build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build-info.json ./build-info.json
USER clarity
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1
ENTRYPOINT ["node", "build/index.js"]
```

## What Changed and Why

| Line/Section | Original | New | Why |
|---|---|---|---|
| Base image | `node:20` | `node:20-alpine` | Alpine is ~50MB vs ~350MB. Smaller = faster deploys, less attack surface |
| Install command | `npm install` | `npm ci` | `npm ci` uses exact lockfile versions. Reproducible builds. Fails if lockfile is out of sync |
| Full node_modules copy | `COPY --from=builder .../node_modules` | `npm ci --omit=dev` in Stage 2 | Your original copies ALL dependencies (including TypeScript, Jest, Vite — ~400MB). The new version installs only production deps (~80MB) |
| Non-root user | (none) | `adduser clarity` + `USER clarity` | Security best practice. If container is compromised, attacker has limited permissions |
| Build metadata | (none) | `build-info.json` | Lets your health endpoint report which commit is deployed |
| HEALTHCHECK | (none) | `wget` to health endpoint | Docker/Cloud Run can verify the container is actually serving requests |
| WORKDIR | `/usr/src/app` | `/app` | Shorter path, same function. Minor cleanup |

## Potential Issues
- **If you use any native npm modules** (node-gyp compiled): Alpine needs `apk add` for build tools. Your stack (Express, Firebase Admin, Stripe) is pure JS, so this shouldn't apply.
- **If you don't have a `package-lock.json`**: `npm ci` will fail. Run `npm install` locally first to generate it, commit it, then switch to `npm ci` in Docker.

## How to Test Locally
```bash
docker build -t clarity-test .
docker run -p 8080:8080 --env-file .env clarity-test
# Then open http://localhost:8080/api/v1/health in your browser
```

---

# 3. File 2: terraform/main.tf

## ORIGINAL (Your Current Code)
```hcl
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

resource "google_project_service" "cloudrun_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "backend_repo" {
  location      = var.region
  repository_id = "clarity-backend"
  description   = "Docker repository for the Clarity API"
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry_api]
}

resource "google_cloud_run_v2_service" "api_service" {
  name     = "clarity-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"   # <-- PLACEHOLDER

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  depends_on = [google_project_service.cloudrun_api]
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = google_cloud_run_v2_service.api_service.project
  location = google_cloud_run_v2_service.api_service.location
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

## NEW (Replacement)
The new `main.tf` is significantly larger. Here are the KEY additions that don't exist in your original:

### Addition 1: Secret Manager (3 secrets)
```hcl
# BEFORE: Secrets were in .env files or manually pasted into Cloud Run console
# AFTER:  Secrets are encrypted in GCP Secret Manager, injected at runtime

resource "google_secret_manager_secret" "gemini_key" {
  secret_id = "clarity-gemini-api-key"
  # ... replication config ...
}
resource "google_secret_manager_secret" "stripe_key" { ... }
resource "google_secret_manager_secret" "stripe_webhook" { ... }
```
**Why:** Your `.env` file with GEMINI_API_KEY and STRIPE_SECRET_KEY sitting on your laptop is a security risk. Secret Manager encrypts them at rest, audits who accessed them, and supports rotation.

### Addition 2: Dedicated Service Account
```hcl
# BEFORE: Cloud Run uses default Compute Engine SA (has WAY too many permissions)
# AFTER:  Dedicated SA with only secretmanager.secretAccessor + logging.logWriter

resource "google_service_account" "clarity_runner" {
  account_id   = "clarity-api-runner"
  display_name = "Clarity API Cloud Run Runner"
}
```
**Why:** Principle of least privilege. If your container is compromised, the attacker can only read secrets and write logs — not access BigQuery, Storage, or other GCP services.

### Addition 3: Cloud Run Secrets Injection
```hcl
# BEFORE: env { name = "NODE_ENV" value = "production" }  — that's it
# AFTER:  Secrets pulled from Secret Manager at container startup

env {
  name = "GEMINI_API_KEY"
  value_source {
    secret_key_ref {
      secret  = google_secret_manager_secret.gemini_key.secret_id
      version = "latest"
    }
  }
}
```
**Why:** Your container never sees the raw secret value in its config. It's injected at runtime from Secret Manager.

### Addition 4: Health Probes
```hcl
# BEFORE: No health checks — Cloud Run can't tell if your app is healthy
# AFTER:  Startup + liveness probes

startup_probe {
  http_get { path = "/api/v1/health" }
  initial_delay_seconds = 5
  period_seconds        = 10
  failure_threshold     = 3
}
```
**Why:** Without probes, Cloud Run will send traffic to a container that's still starting up (or has crashed). With probes, it waits until your server is ready.

### Addition 5: Resource Limits + Scaling
```hcl
# BEFORE: No resource limits (default: 1 CPU, 512MB — but not explicit)
# AFTER:  Explicit limits with cost optimizations

resources {
  limits = { cpu = "1", memory = "512Mi" }
  cpu_idle          = true   # Don't charge for CPU when idle
  startup_cpu_boost = true   # Extra CPU during cold starts
}
scaling {
  min_instance_count = var.min_instances  # 0 = scale to zero
  max_instance_count = var.max_instances  # 10 = cost ceiling
}
```

## How to Migrate Terraform Safely
```bash
# Step 1: Back up your current state
cd terraform
cp terraform.tfstate terraform.tfstate.backup  # if you have state

# Step 2: Replace main.tf, add new files
# (copy the new main.tf, variables.tf, outputs.tf, terraform.tfvars.example)

# Step 3: Create your terraform.tfvars (from the example)
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your REAL secret values

# Step 4: Preview changes WITHOUT applying
terraform init    # Download new providers
terraform plan    # Shows what WOULD change — read this carefully

# Step 5: Only apply when you understand every change
terraform apply   # Type 'yes' to confirm
```

**IMPORTANT:** If you've never run `terraform apply` before (your Cloud Run was set up manually), you'll need to import existing resources first:
```bash
terraform import google_cloud_run_v2_service.api_service projects/YOUR_PROJECT/locations/us-central1/services/clarity-api
```

---

# 4. File 3: tsconfig.json

## ORIGINAL
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./build",
    "rootDir": ".",
    "strict": false,                          // <-- THE KEY DIFFERENCE
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src/**/*", "index.ts"],
  "exclude": ["node_modules", "dist", "build", "tests", "terraform"]
}
```

## NEW
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./build",
    "rootDir": ".",
    "strict": true,                           // <-- CHANGED
    "noUncheckedIndexedAccess": true,          // <-- ADDED
    "noUnusedLocals": true,                    // <-- ADDED
    "noUnusedParameters": true,                // <-- ADDED
    "noFallthroughCasesInSwitch": true,        // <-- ADDED
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["src/**/*", "index.ts"],
  "exclude": ["node_modules", "dist", "build", "tests", "terraform"]
}
```

## What Changed
| Flag | Before | After | What It Catches |
|---|---|---|---|
| `strict` | `false` | `true` | Enables ALL strict checks below as a bundle |
| `noImplicitAny` | off | on (via strict) | `function foo(x)` → error. Must be `foo(x: string)` |
| `strictNullChecks` | off | on (via strict) | `const x: string = maybeNull` → error. Forces you to handle null |
| `strictFunctionTypes` | off | on (via strict) | Catches parameter type mismatches in callbacks |
| `noUncheckedIndexedAccess` | N/A | `true` | `array[0]` returns `T | undefined`, not `T` |
| `noUnusedLocals` | N/A | `true` | Errors on variables you declared but never used |
| `noUnusedParameters` | N/A | `true` | Errors on function params you never use |

## SAFE INCREMENTAL APPROACH
**Do NOT flip to `strict: true` all at once.** Instead:

```json
// Week 1: Start here
"strict": false,
"noImplicitAny": true
// Fix all 'any' type errors first
// Run: npx tsc --noEmit to see errors without building
```

```json
// Week 2: After 'any' errors are fixed
"strict": false,
"noImplicitAny": true,
"strictNullChecks": true
// Fix all null/undefined errors
```

```json
// Week 3: Everything else
"strict": true,
"noUncheckedIndexedAccess": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
```

## The Errors You'll See (and How to Fix Them)

### Error: `db: any` throughout your services
```typescript
// BEFORE (your current code — triggers noImplicitAny)
export const checkAndRecordUsage = async (db: any, teamCode: string) => { ... }

// AFTER (properly typed)
import { Firestore } from 'firebase-admin/firestore';
export const checkAndRecordUsage = async (db: Firestore, teamCode: string) => { ... }
```

### Error: `(req as any).user` in your routes
```typescript
// BEFORE (your current code)
const uid = (req as any).user?.uid || 'anonymous';

// AFTER (extend Express Request type)
// Create: src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: { uid: string; email?: string };
  }
}
// Then in routes:
const uid = req.user?.uid || 'anonymous';
```

---

# 5. File 4: index.ts (Server Entry Point)

This is the largest change. Here's a section-by-section comparison.

## ORIGINAL: CORS Setup
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://pm-alignment-assistant-132738195526.us-central1.run.app'
];

app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## NEW: CORS Setup
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.PRODUCTION_URL,       // <-- CHANGED: dynamic, set via Terraform
].filter(Boolean) as string[];

app.use(cors({
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });  // <-- ADDED: logging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['x-request-id'],  // <-- ADDED: lets frontend read correlation ID
}));
```
**Why:** Hardcoding your Cloud Run URL means you have to change code when you redeploy. Using `process.env.PRODUCTION_URL` means Terraform sets it.

---

## ORIGINAL: Body Parsing
```typescript
app.use(express.json());
```

## NEW: Body Parsing
```typescript
// Raw body needed for Stripe webhook signature verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
```
**Why:** Stripe webhooks need the RAW request body (not parsed JSON) to verify the signature. Without this, webhook signature verification ALWAYS fails. The `express.raw()` MUST come before `express.json()` for the webhook route.

---

## ORIGINAL: Firebase Init
```typescript
try {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
} catch (e) {
    logger.error('Firebase initialized failed', { error: e });
}
```

## NEW: Firebase Init
```typescript
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,  // <-- ADDED: explicit project ID
    });
  }
} catch (e) {
  logger.error('Firebase initialization failed', { error: e });
  process.exit(1);  // <-- ADDED: crash immediately if DB is unavailable
}
```
**Why:** In production (Cloud Run), there's no `.env` file with GOOGLE_APPLICATION_CREDENTIALS. The explicit `projectId` ensures Firebase Admin knows which project to connect to. The `process.exit(1)` prevents your server from starting without a database — serving requests that will all fail is worse than crashing and letting Cloud Run restart you.

---

## ORIGINAL: Health Check
```typescript
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'Online',
        mode: NODE_ENV === 'production' ? 'Production' : 'Development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
```

## NEW: Health + Readiness
```typescript
// Health (lightweight — no DB call)
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    build: buildInfo,                              // <-- ADDED: which commit is deployed
    uptime_seconds: Math.floor(process.uptime()),  // <-- ADDED: how long since last restart
    timestamp: new Date().toISOString(),
  });
});

// Readiness (checks DB connectivity)
app.get('/api/v1/ready', async (_req: Request, res: Response) => {
  try {
    await db.collection('_health').doc('ping').get();
    res.json({ status: 'ready', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});
```
**Why:** Health = "is the process alive?" (Cloud Run liveness probe). Readiness = "can it serve real traffic?" (checks if Firestore is reachable). Two different questions, two different endpoints.

---

## ORIGINAL: Route Mounting
```typescript
app.use(teamRoutes);
app.use(paymentRoutes);
```

## NEW: Route Mounting with API Versioning
```typescript
// V1 routes
app.use('/api/v1', teamRoutes);
app.use('/api/v1', paymentRoutes);

// Backward compatibility — old /api/* redirects to /api/v1/*
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/v1')) return next();
  logger.warn('Deprecated API path used', { path: req.originalUrl });
  res.redirect(307, `/api/v1${req.path}`);
});
```
**Why:** The redirect means your EXISTING frontend still works without any changes. It will call `/api/analyze-alignment`, get redirected to `/api/v1/analyze-alignment`, and everything functions. You update the frontend config at your own pace.

---

## ORIGINAL: SPA Fallback
```typescript
app.get(/.*/, (req: Request, res: Response) =>
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);
```

## NEW: SPA Fallback + Graceful Shutdown
```typescript
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Graceful Shutdown
const server = app.listen(process.env.PORT || 8080, () => { ... });

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — starting graceful shutdown');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10_000);
});
```
**Why:** Cloud Run sends SIGTERM before killing your container. Without graceful shutdown, active requests get dropped mid-response. With it, the server stops accepting new connections but lets in-flight requests finish (up to 10 seconds).

---

## COMPLETELY NEW Sections in index.ts

### Correlation ID Middleware
```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
});
```
**What this does:** Every HTTP request gets a unique ID. This ID appears in every log entry for that request. When a user reports "my alignment check failed," you search logs by request ID and see the EXACT sequence of events for that one request.

### Request Duration Logging
```typescript
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger[res.statusCode >= 400 ? 'warn' : 'info']('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      requestId: res.locals.requestId,
    });
  });
  next();
});
```
**What this does:** Logs every request with how long it took. You can now identify slow endpoints. If `/api/v1/analyze-alignment` suddenly takes 5000ms instead of 800ms, you'll see it in logs.

---

# 6. File 5: src/routes/team.ts

## ORIGINAL Route Path
```typescript
router.post('/api/analyze-alignment', ...);
```

## NEW Route Path
```typescript
router.post('/analyze-alignment', ...);
```

**Why:** Since `index.ts` now mounts this router under `/api/v1`, the full path becomes `/api/v1/analyze-alignment`. The route definition drops the `/api` prefix.

## Other Changes
```typescript
// ADDED: Request ID in all log entries
const requestId = res.locals.requestId;
logger.info('Alignment check received', { requestId, teamCode, name, role, uid });
```

Everything else in this file is IDENTICAL to your original. The business logic didn't change.

---

# 7. File 6: src/routes/payment.ts

## Same Path Change as team.ts
```typescript
// BEFORE
router.post('/api/create-checkout-session', ...);
router.post('/api/verify-upgrade', ...);

// AFTER
router.post('/create-checkout-session', ...);
router.post('/verify-upgrade', ...);
```

## COMPLETELY NEW: Stripe Webhook Endpoint
```typescript
router.post('/webhooks/stripe', async (req: Request, res: Response) => {
  // 1. Verify the request came from Stripe (signature check)
  // 2. If checkout.session.completed → upgrade team to Pro
  // 3. Return 200 to acknowledge receipt
});
```

**Why this is critical:**

Your current payment flow:
```
User pays → Stripe redirects to ?upgrade=success → Frontend POSTs /verify-upgrade → Backend upgrades team
```

The problem: If the user closes the tab AFTER paying but BEFORE the redirect completes, they paid $49 and never got upgraded. You'd have to manually check Stripe and fix their account.

The webhook flow:
```
User pays → Stripe calls YOUR SERVER directly → Backend upgrades team
                                                 (regardless of what the user's browser does)
```

**Setup required in Stripe Dashboard:**
1. Go to Developers → Webhooks → Add endpoint
2. URL: `https://your-cloudrun-url/api/v1/webhooks/stripe`
3. Events: Select `checkout.session.completed`
4. Copy the webhook signing secret → add to your `terraform.tfvars` as `stripe_webhook_secret`

---

# 8. NEW Files (No Original Exists)

These files are purely additive — they don't replace anything.

| File | Purpose | Risk |
|---|---|---|
| `.gitignore` | Prevents secrets and build artifacts from being committed | Zero — only affects future commits |
| `.dockerignore` | Speeds up Docker builds by excluding unnecessary files | Zero — only affects Docker context |
| `.github/workflows/deploy.yml` | CI/CD pipeline — only runs on push to `main` | Zero on feature branch |
| `terraform/variables.tf` | Defines input variables for Terraform | Zero — Terraform reads it only when you run it |
| `terraform/outputs.tf` | Prints useful info after `terraform apply` | Zero |
| `terraform/terraform.tfvars.example` | Template for your secret values | Zero — it's a template, not the real file |

---

# 9. Frontend Config Update

After all backend changes are live, update your frontend API config:

## ORIGINAL: src/api/config.js
```javascript
export const API_URL = 'http://localhost:8080';
// Frontend calls: fetch(`${API_URL}/api/analyze-alignment`)
// Resolves to:    http://localhost:8080/api/analyze-alignment
```

## NEW: src/api/config.js
```javascript
// Development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// Frontend calls: fetch(`${API_URL}/api/v1/analyze-alignment`)
// Resolves to:    http://localhost:8080/api/v1/analyze-alignment
```

**IMPORTANT:** You do NOT need to make this change immediately. The backward-compatibility redirect in `index.ts` will automatically forward `/api/analyze-alignment` → `/api/v1/analyze-alignment`. Update the frontend when you're ready.

**All frontend fetch calls that need updating:**

| File | Current Call | Updated Call |
|---|---|---|
| `MemberAction.jsx` | `${API_URL}/api/analyze-alignment` | `${API_URL}/api/v1/analyze-alignment` |
| `LeaderPortal.jsx` | `${API_URL}/api/create-checkout-session` | `${API_URL}/api/v1/create-checkout-session` |
| `LeaderPortal.jsx` | `${API_URL}/api/verify-upgrade` | `${API_URL}/api/v1/verify-upgrade` |
| `MemberDashboard.jsx` | `${API_URL}/api/goals?user=${email}` | `${API_URL}/api/v1/goals?user=${email}` |

---

# 10. Claude Code Integration Commands

If you're using Claude Code in your terminal, here are the exact commands to have it help you migrate:

```bash
# In your project root, with Claude Code running:

# Step 1: Have Claude Code review a specific file change
claude "Compare my current Dockerfile with the new one at /path/to/new/Dockerfile. 
        Explain each difference and check for any conflicts with my existing setup."

# Step 2: Have Claude Code find all files that need API URL updates
claude "Search my frontend codebase for all fetch calls that use /api/ 
        and list which ones need to be updated to /api/v1/"

# Step 3: Have Claude Code run the type checker after tsconfig change
claude "Run npx tsc --noEmit and help me fix any type errors that appear"

# Step 4: Have Claude Code verify the Docker build works
claude "Build the Docker image locally and check if the health endpoint responds"
```

---

# 11. Verification Checklist

Run through this checklist after each commit:

## After Commit 1 (.gitignore + .dockerignore)
- [ ] `git status` shows no tracked .env files
- [ ] `terraform.tfvars` is NOT in git

## After Commit 2 (Terraform files)
- [ ] `terraform init` succeeds
- [ ] `terraform plan` shows expected changes (review carefully)
- [ ] `terraform apply` succeeds (only when ready)

## After Commit 3 (Dockerfile)
- [ ] `docker build -t clarity-test .` succeeds
- [ ] `docker run -p 8080:8080 --env-file .env clarity-test` starts
- [ ] `curl http://localhost:8080/api/v1/health` returns JSON

## After Commit 4 (tsconfig.json)
- [ ] `npx tsc --noEmit` shows 0 errors (after fixing type issues)
- [ ] `npm run build:backend` succeeds

## After Commit 5 (index.ts + routes)
- [ ] `npm run dev` starts without errors
- [ ] `curl http://localhost:8080/api/v1/health` returns JSON with build info
- [ ] `curl http://localhost:8080/api/v1/ready` returns database status
- [ ] `curl http://localhost:8080/api/analyze-alignment` redirects to v1 (307)
- [ ] Frontend login + alignment check still works end-to-end

## After Commit 6 (CI/CD)
- [ ] GitHub secrets configured: GCP_PROJECT_ID, GCP_SA_KEY, GCP_REGION
- [ ] Push to a test branch first to verify the pipeline
- [ ] Pipeline reaches deploy stage only after tests pass

---

*This document was generated as part of the Clarity Phase 1: Infrastructure & DevOps migration.*
*Review every change before applying. When in doubt, ask Claude Code to explain.*
