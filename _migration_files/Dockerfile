# ============================================================================
# Clarity — Production Dockerfile
# ============================================================================
# Multi-stage build:
#   Stage 1 (builder):  Full Node.js with dev deps → compile TS + build React
#   Stage 2 (production): Slim Node.js with ONLY production deps → run server
#
# Why this matters:
#   - builder stage: ~900MB (includes TypeScript compiler, Vite, all dev tools)
#   - production stage: ~180MB (only Express, Stripe SDK, Firebase Admin, etc.)
#   - That's an 80% reduction in image size, which means faster deploys and
#     a smaller attack surface in production.
# ============================================================================

# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

# Build-time metadata (injected by CI/CD pipeline)
ARG BUILD_SHA=local
ARG BUILD_TIME=unknown

WORKDIR /app

# Copy package files first — Docker caches this layer independently.
# If your dependencies haven't changed, Docker skips `npm ci` entirely.
# This alone can save 2-3 minutes on every build.
COPY package.json package-lock.json ./

# `npm ci` is stricter than `npm install`:
# - Uses exact versions from package-lock.json (reproducible builds)
# - Fails if package-lock.json is out of sync (catches mistakes)
RUN npm ci

# Now copy source code (this layer busts cache only when code changes)
COPY . .

# Compile TypeScript backend → /app/build
RUN npm run build:backend

# Build React frontend → /app/dist
RUN npm run build

# Write build metadata into the image (used by /api/v1/health)
RUN echo "{\"sha\":\"${BUILD_SHA}\",\"time\":\"${BUILD_TIME}\"}" > build-info.json


# --- STAGE 2: Production ---
FROM node:20-alpine AS production

# Security: don't run as root in production
# If an attacker exploits a vulnerability, they only get 'clarity' user
# permissions, not root access to the container.
RUN addgroup -S clarity && adduser -S clarity -G clarity

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build-info.json ./build-info.json

# Switch to non-root user
USER clarity

# Cloud Run injects PORT env var; default to 8080
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE ${PORT}

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

ENTRYPOINT ["node", "build/index.js"]
