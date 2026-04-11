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

// Notice how these imports perfectly match the ES module exports we set up earlier
import { errorHandler } from './src/utils/errors';
import logger from './src/utils/logger';

/* --- APP SETUP --- */
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://pm-alignment-assistant-132738195526.us-central1.run.app'
];

const app = express();

// Static files served BEFORE cors middleware
app.use(express.static(path.join(__dirname, 'dist')));

app.use(cors({
  // We strictly type the origin string and the callback function here
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

/* --- DATABASE SETUP --- */
try {
    // A safer initialization check for Firebase Admin
    if (!admin.apps.length) {
        admin.initializeApp();
    }
} catch (e) {
    logger.error('Firebase initialized failed', { error: e });
}

const db = getFirestore();
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

/* --- CENTRAL ERROR HANDLER --- */
app.use(errorHandler);

/* --- SERVE FRONTEND --- */
app.get(/.*/, (req: Request, res: Response) =>
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);

/* --- START SERVER --- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { mode: NODE_ENV });
});