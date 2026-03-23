/* --- CORE CONFIGURATION --- */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

/* --- ROUTE IMPORTS --- */
const teamRoutes = require('./src/routes/team');
const paymentRoutes = require('./src/routes/payment');
const { errorHandler } = require('./src/utils/errors');
const logger = require('./src/utils/logger');

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
// so assets never hit cors checks
app.use(express.static(path.join(__dirname, 'dist')));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

/* --- DATABASE SETUP --- */
try {
    admin.initializeApp();
} catch (e) {
    // Already initialized
}

const db = getFirestore();
app.locals.db = db;

/* --- HEALTH CHECK --- */
app.get('/api/health', (req, res) => {
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
app.get(/.*/, (req, res) =>
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);

/* --- START SERVER --- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { mode: NODE_ENV });
});