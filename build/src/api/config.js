"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = exports.config = void 0;
/* src/api/config.js - FRONTEND ONLY VERSION */
exports.config = {
    // If running locally on your Mac, talk to localhost:8080.
    // If deployed to Google Cloud, use an empty string so it automatically routes to itself.
    apiUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : ''
};
exports.API_URL = exports.config.apiUrl;
exports.default = exports.config;
/* // src/api/config.js - FRONTEND ONLY VERSION //
export const config = {
    apiUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://clarity-pm-assistant-132738195526.us-central1.run.app'
};

export const API_URL = config.apiUrl;
export default config;
*/ 
