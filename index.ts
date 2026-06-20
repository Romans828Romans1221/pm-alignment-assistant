/* --- CORE CONFIGURATION --- root folder index.ts */
import 'dotenv/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

/* --- ROUTE IMPORTS --- */
import teamRoutes from './src/routes/team';
import paymentRoutes from './src/routes/payment';
import inviteRoutes from './src/routes/invites';
import documentRoutes from './src/routes/documents';
import meetingRoutes from './src/routes/meeting';


// Notice how these imports perfectly match the ES module exports we set up earlier
import { errorHandler } from './src/utils/errors';
import logger from './src/utils/logger';

/* --- APP SETUP --- */
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://localhost:3010',
  'https://pm-alignment-assistant-132738195526.us-central1.run.app',
  'https://tryclarityapp.live'
];

const app = express();
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

/* --- DATABASE SETUP --- */
try {
  // A safer initialization check for Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  logger.error('Firebase initialized failed', { error: e });
}

export const db = getFirestore();
app.locals.db = db;

/* --- HEALTH CHECK --- */
// Strictly typing req and res
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'Online',
    mode: NODE_ENV === 'production' ? 'Production' : 'Development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/* --- ROUTES --- */
app.use(teamRoutes);
app.use(paymentRoutes);
app.use('/api', inviteRoutes);
app.use('/', documentRoutes);
app.use('/', meetingRoutes);


/* --- CENTRAL ERROR HANDLER --- */
app.use(errorHandler);

/* --- SERVE FRONTEND --- */
app.get(/.*/, (req: Request, res: Response) =>
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
);

/* --- START SERVER --- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { mode: NODE_ENV });
});