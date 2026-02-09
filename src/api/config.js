
//export const API_URL = 'https://clarity-pm-assistant-132738195526.us-central1.run.app';
//export const API_URL = 'http://localhost:8080';

/* src/api/config.js */

// Senior Dev Safety: Read keys from the environment (local .env or GCP)
const geminiApiKey = process.env.GEMINI_API_KEY;
const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
    geminiApiKey,
    nodeEnv,
    // Keep your existing URL logic
    apiUrl: nodeEnv === 'production' 
        ? 'https://clarity-pm-assistant-132738195526.us-central1.run.app' 
        : 'http://localhost:8080'
};



// Guard Clause: Prevent the app from running without a key in production
if (!config.geminiApiKey && config.nodeEnv === 'production') {
    console.error("🚨 CRITICAL ERROR: GEMINI_API_KEY is missing in production.");
    // This stops the server if it's broken
}

export default config;