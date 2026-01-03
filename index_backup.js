require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // <--- NEW LIBRARY
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. SERVE REACT APP
app.use(express.static(path.join(__dirname, 'dist')));

// 2. DATABASE SETUP
admin.initializeApp();
const db = getFirestore();

// 3. AI CONFIGURATION (API KEY MODE)
// We check if the key exists to warn the user if it's missing
if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is missing in .env file!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "INVALID_KEY");
const MODEL_NAME = 'gemini-1.5-flash';

// --- API ROUTES ---

// A. GENERATE PLAN
app.post('/api/generate-plan', async (req, res) => {
    const { projectGoal, teamRoles, teamCode } = req.body;
    let aiPlan = null;
    const cleanCode = teamCode ? teamCode.trim() : null;

    try {
        if (cleanCode) {
            await db.collection('goals').add({
                teamCode: cleanCode,
                goal: projectGoal,
                context: teamRoles || "No context",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // AI Try/Catch Block
        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });
            const prompt = `Act as PM. Goal: "${projectGoal}". Return JSON: { "projectName": "Title", "tasks": [] }`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            aiPlan = JSON.parse(text);
        } catch (e) {
            console.warn("⚠️ AI Plan Gen Failed:", e.message);
        }
        res.json({ success: true, plan: aiPlan });
    } catch (e) {
        res.status(500).json({ error: "DB Error" });
    }
});

// B. FETCH GOALS
app.get('/api/goals', async (req, res) => {
    try {
        const code = req.query.code || req.query.teamCode;
        if (!code) return res.status(400).json({ error: "No code" });
        const snapshot = await db.collection('goals').where('teamCode', '==', code.trim()).limit(1).get();
        if (snapshot.empty) return res.json({ success: false });
        res.json({ success: true, ...snapshot.docs[0].data() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// C. ANALYZE ALIGNMENT (The Brain)
app.post('/api/analyze-alignment', async (req, res) => {
    try {
        const { teamCode, role, name, understanding } = req.body;

        // DEBUG LOG
        console.log(`\n📢 PROCESSING: ${name} (${role})`);

        const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Goal not found" });
        const leaderGoal = snapshot.docs[0].data().goal;

        // --- THE AI PART ---
        let analysis = { score: 0, meetingType: "Error", feedback: "AI Unavailable" };

        try {
            console.log("🧠 Calling Gemini AI (API Key Mode)...");
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
            // 🚨 FALLBACK: SIMULATION MODE
            console.error("❌ AI Error (Using Backup Generator):", e.message);

            const wordCount = understanding.split(' ').length;
            const simulatedScore = wordCount > 5 ? 85 : 45;

            analysis = {
                score: simulatedScore,
                meetingType: simulatedScore > 80 ? "None" : "1:1 Meeting",
                feedback: simulatedScore > 80
                    ? "Simulation: Great alignment detected based on detailed response."
                    : "Simulation: Response is too brief. Connect to clarify details."
            };
            console.log("⚠️ SIMULATION APPLIED. Score:", analysis.score);
        }

        // SAVE TO DB
        await db.collection('alignments').add({
            teamCode,
            role,
            name: name || "Anonymous",
            understanding,
            analysis,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, analysis });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// D. FETCH ALIGNMENTS
app.get('/api/alignments', async (req, res) => {
    try {
        const code = req.query.code;
        const snapshot = await db.collection('alignments').where('teamCode', '==', code.trim()).get();
        const results = [];
        snapshot.forEach(doc => results.push(doc.data()));
        res.json({ success: true, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. ROUTE CATCHER
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));