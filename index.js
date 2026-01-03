require('dotenv').config();
const express = require('express');
const cors = require('cors');
// 1. IMPORT THE DEVELOPER LIBRARY
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 2. DATABASE SETUP
try {
    admin.initializeApp();
} catch (e) {
    // Ignore if already initialized
}
const db = getFirestore();

// 3. AI CONFIGURATION (Real AI Restored)
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_KEY");
// using the verified working alias
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
    res.json({ status: "Online", mode: "Real AI (gemini-flash-latest)" });
});

app.post('/api/analyze-alignment', async (req, res) => {
    try {
        const { teamCode, role, name, understanding } = req.body;
        console.log(`\n📢 PROCESSING: ${name} (${role})`);

        // Database Fetch
        const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Goal not found" });
        const leaderGoal = snapshot.docs[0].data().goal;

        // AI Logic (Real)
        let analysis = { score: 50, meetingType: "Needs Review", feedback: "AI Unavailable" };
        try {
            console.log("🧠 Calling Gemini (flash-latest)...");

            const prompt = `
                Leader Goal: "${leaderGoal}"
                Member (${name}, ${role}) Understanding: "${understanding}"
                
                Compare them. Return strictly this JSON: 
                { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice for leader" }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

            analysis = JSON.parse(text);
            console.log("✅ AI Success! Score:", analysis.score);

        } catch (e) {
            console.error("❌ AI Error (Falling back to safe default):", e.message);
            // If it fails, we provide a safe fallback so the app doesn't crash
            analysis = {
                score: 55,
                meetingType: "1:1 Meeting",
                feedback: "AI Connection Error. Please verify understanding manually."
            };
        }

        // Save & Return
        await db.collection('alignments').add({ teamCode, role, name, understanding, analysis, timestamp: new Date() });
        res.json({ success: true, analysis });
    } catch (e) {
        console.error("Server Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Restore other routes to keep UI working
app.post('/api/generate-plan', async (req, res) => {
    const { projectGoal, teamRoles, teamCode } = req.body;
    if (teamCode) {
        await db.collection('goals').add({ teamCode, goal: projectGoal, context: teamRoles, timestamp: new Date() });
    }
    res.json({ success: true, plan: { projectName: "Saved", tasks: [] } });
});

app.get('/api/goals', async (req, res) => {
    const code = req.query.code || req.query.teamCode;
    const snapshot = await db.collection('goals').where('teamCode', '==', code).limit(1).get();
    if (snapshot.empty) return res.json({ success: false });
    res.json({ success: true, ...snapshot.docs[0].data() });
});

app.get('/api/alignments', async (req, res) => {
    const code = req.query.code;
    const snapshot = await db.collection('alignments').where('teamCode', '==', code).get();
    const results = [];
    snapshot.forEach(doc => results.push(doc.data()));
    res.json({ success: true, results });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
