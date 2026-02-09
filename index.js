/* --- 1. CORE CONFIGURATION --- */
require('dotenv').config(); // Loads local .env for development
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Import your Senior Dev config file
const { config } = require('./src/api/config'); 

const app = express();
app.use(cors());
app.use(express.json()); // Essential for reading req.body
app.use(express.static(path.join(__dirname, 'dist')));

/* --- 2. DATABASE & AI SETUP --- */
try {
    admin.initializeApp();
} catch (e) {
    // Already initialized
}
const db = getFirestore();

// Use the API key specifically from your config object
const API_KEY = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/* --- 3. THE UNIFIED API ROUTE --- */
// This merges the Validation Shield with your AI Business Logic
app.post('/api/analyze-alignment', async (req, res) => {
    try {
        // --- STEP A: VALIDATION SHIELD (The "Senior" Check) ---
        const { teamCode, role, name, understanding, goal, context } = req.body;
        
        // Block invalid data before it hits your DB or AI costs
        if (!teamCode || typeof teamCode !== 'string' || teamCode.length > 50) {
            return res.status(400).json({ 
                error: "Invalid Team Code",
                message: "A valid team code is required to proceed." 
            });
        }

        // --- STEP B: LOGGING & PREPARATION ---
        console.log("\n📦 PACKET RECEIVED:", name);
        let leaderGoal = goal;
        let leaderContext = context || "";

        // --- STEP C: THE "HYBRID" CHECK (DB vs Frontend) ---
        if (!leaderGoal) {
            console.log("🔍 Goal missing in body. Searching DB for code:", teamCode);
            const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();

            if (snapshot.empty) {
                return res.status(404).json({ error: "Goal not found in database." });
            }

            leaderGoal = snapshot.docs[0].data().goal;
            leaderContext = snapshot.docs[0].data().context || "";
        }

        // --- STEP D: AI GENERATION ---
        console.log("🧠 Calling Gemini AI...");
        const prompt = `
            Leader Goal: "${leaderGoal}"
            Context: "${leaderContext}"
            Member (${name}, ${role}) Understanding: "${understanding}"
            Compare them. Return strictly this JSON: 
            { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        // --- STEP E: SAVE & RETURN ---
        await db.collection('alignments').add({ 
            teamCode, role, name, understanding, analysis, timestamp: new Date() 
        });
        
        res.json({ success: true, analysis });

    } catch (e) {
        console.error("❌ Server Error:", e);
        res.status(500).json({ error: "Internal Server Error", message: e.message });
    }
});

/* --- 4. ADDITIONAL ROUTES --- */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: "Online", 
        mode: config.nodeEnv === 'production' ? "Production" : "Development" 
    });
});

// Serve the frontend PWA for any non-API route
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = config.port || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));