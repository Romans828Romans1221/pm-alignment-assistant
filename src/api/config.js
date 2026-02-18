/* src/api/config.js - FRONTEND ONLY VERSION */
export const config = {
    apiUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:8080'
        : 'https://clarity-pm-assistant-132738195526.us-central1.run.app'
};

export const API_URL = config.apiUrl;
export default config;