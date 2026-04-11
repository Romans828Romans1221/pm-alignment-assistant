"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* --- CORE CONFIGURATION --- root folder index.ts */
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
/* --- ROUTE IMPORTS --- */
const team_1 = __importDefault(require("./src/routes/team"));
const payment_1 = __importDefault(require("./src/routes/payment"));
// Notice how these imports perfectly match the ES module exports we set up earlier
const errors_1 = require("./src/utils/errors");
const logger_1 = __importDefault(require("./src/utils/logger"));
/* --- APP SETUP --- */
const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://pm-alignment-assistant-132738195526.us-central1.run.app'
];
const app = (0, express_1.default)();
// Static files served BEFORE cors middleware
app.use(express_1.default.static(path_1.default.join(__dirname, 'dist')));
app.use((0, cors_1.default)({
    // We strictly type the origin string and the callback function here
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
/* --- DATABASE SETUP --- */
try {
    // A safer initialization check for Firebase Admin
    if (!admin.apps.length) {
        admin.initializeApp();
    }
}
catch (e) {
    logger_1.default.error('Firebase initialized failed', { error: e });
}
const db = (0, firestore_1.getFirestore)();
app.locals.db = db;
/* --- HEALTH CHECK --- */
// Strictly typing req and res
app.get('/api/health', (req, res) => {
    res.json({
        status: 'Online',
        mode: NODE_ENV === 'production' ? 'Production' : 'Development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
/* --- ROUTES --- */
app.use(team_1.default);
app.use(payment_1.default);
/* --- CENTRAL ERROR HANDLER --- */
app.use(errors_1.errorHandler);
/* --- SERVE FRONTEND --- */
app.get(/.*/, (req, res) => res.sendFile(path_1.default.join(__dirname, 'dist', 'index.html')));
/* --- START SERVER --- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`, { mode: NODE_ENV });
});
