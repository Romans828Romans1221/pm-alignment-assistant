/* ============================================================================
 * Clarity API — Server Entry Point
 * ============================================================================
 * Architecture decisions documented here:
 *
 * 1. API VERSIONING (/api/v1/...)
 *    All routes are namespaced under /api/v1. When you need breaking changes,
 *    create /api/v2 routes alongside v1 — old clients keep working while
 *    new clients adopt v2. This is how Stripe, GitHub, and every serious
 *    API handles evolution.
 *
 * 2. CORRELATION IDs
 *    Every request gets a unique ID (x-request-id header). This ID flows
 *    through every log entry, so when debugging production issues you can
 *    trace a single request across all log lines. This is standard practice
 *    in distributed systems.
 *
 * 3. HEALTH vs READINESS
 *    /api/v1/health — "Is the process alive?" (lightweight, no DB call)
 *    /api/v1/ready  — "Can this instance serve traffic?" (checks DB connection)
 *    Cloud Run uses startup_probe → health, liveness_probe → health.
 *    You'd use /ready for load balancers that need to know if a specific
 *    instance should receive traffic.
 * ============================================================================ */

import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

import teamRoutes from './src/routes/team';
import paymentRoutes from './src/routes/payment';
import { errorHandler } from './src/utils/errors';
import logger from './src/utils/logger';

/* ── Build Info (written by Docker build stage) ── */
let buildInfo = { sha: 'local', time: 'development' };
try {
  buildInfo = require('./build-info.json');
} catch {
  // Running locally — that's fine
}

/* ── App Setup ── */
const NODE_ENV = process.env.NODE_ENV || 'development';
const app = express();

/* ── CORS Configuration ── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.PRODUCTION_URL,       // Set via Terraform/Cloud Run
].filter(Boolean) as string[];

app.use(cors({
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['x-request-id'],  // Let frontend read correlation ID
}));

/* ── Middleware: Correlation ID ── */
// Assigns a unique ID to every request for end-to-end tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Attach to Express locals so services can access it
  res.locals.requestId = requestId;
  next();
});

/* ── Middleware: Request Logging ── */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log when the response finishes (not when the request arrives)
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      requestId: res.locals.requestId,
      userAgent: req.get('user-agent'),
    });
  });

  next();
});

/* ── Body Parsing ── */
// Raw body needed for Stripe webhook signature verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

/* ── Static Files (React frontend) ── */
app.use(express.static(path.join(__dirname, 'dist')));

/* ── Database Setup ── */
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
} catch (e) {
  logger.error('Firebase initialization failed', { error: e });
  process.exit(1);  // Can't serve requests without a database
}

const db = getFirestore();
app.locals.db = db;

/* ── Health Check (lightweight — no DB call) ── */
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    build: buildInfo,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ── Readiness Check (verifies DB connectivity) ── */
app.get('/api/v1/ready', async (_req: Request, res: Response) => {
  try {
    // Quick Firestore read to verify the connection is alive
    await db.collection('_health').doc('ping').get();
    res.json({ status: 'ready', database: 'connected' });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});

/* ── API v1 Routes ── */
app.use('/api/v1', teamRoutes);
app.use('/api/v1', paymentRoutes);

// Backward compatibility — redirect old /api/* calls to /api/v1/*
// Remove this once all clients are updated
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  // Don't redirect the versioned routes or health checks
  if (req.path.startsWith('/v1')) return next();
  logger.warn('Deprecated API path used', { path: req.originalUrl });
  res.redirect(307, `/api/v1${req.path}`);
});

/* ── Central Error Handler ── */
app.use(errorHandler);

/* ── SPA Fallback (React Router support) ── */
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

/* ── Graceful Shutdown ── */
const server = app.listen(process.env.PORT || 8080, () => {
  logger.info('Server started', {
    port: process.env.PORT || 8080,
    environment: NODE_ENV,
    build: buildInfo.sha,
  });
});

// Cloud Run sends SIGTERM before killing the container.
// This gives active requests time to finish.
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — starting graceful shutdown');
  server.close(() => {
    logger.info('Server closed — all connections drained');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if connections won't drain
  setTimeout(() => {
    logger.error('Forced shutdown — connections did not drain in time');
    process.exit(1);
  }, 10_000);
});
