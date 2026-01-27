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

// 3. AI CONFIGURATION
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
    res.json({ status: "Online", mode: "Real AI (gemini-flash-latest)" });
});

// ▼▼▼ THE FIXED ROUTE ▼▼▼
app.post('/api/analyze-alignment', async (req, res) => {
    try {
        // 1. Unpack the payload
        const { teamCode, role, name, understanding, goal, context } = req.body;

        // DEBUG LOG: Verify what arrived
        console.log("\n📦 PACKET RECEIVED:");
        console.log(" - User:", name);
        console.log(" - Goal Provided?", goal ? "YES" : "NO");

        let leaderGoal = goal;
        let leaderContext = context || "";

        // 2. The "Hybrid" Check
        // If the frontend didn't send the goal (Old System), we look it up in the DB.
        if (!leaderGoal) {
            console.log("🔍 Goal missing in body. Searching DB for code:", teamCode);
            const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();

            if (snapshot.empty) {
                console.error("❌ Database lookup failed.");
                return res.status(404).json({ error: "Goal not found" });
            }

            leaderGoal = snapshot.docs[0].data().goal;
            if (snapshot.docs[0].data().context) {
                leaderContext = snapshot.docs[0].data().context;
            }
        } else {
            console.log("✅ Using Goal provided by Frontend (New System)");
        }

        // 3. AI Logic
        let analysis = { score: 50, meetingType: "Needs Review", feedback: "AI Unavailable" };
        try {
            console.log("🧠 Calling Gemini...");

            const prompt = `
                Leader Goal: "${leaderGoal}"
                Context: "${leaderContext}"
                
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
            console.error("❌ AI Error:", e.message);
            analysis = {
                score: 55,
                meetingType: "1:1 Meeting",
                feedback: "AI Connection Error."
            };
        }

        // 4. Save & Return
        // Note: We save to 'alignments' even if we didn't look up the goal in the DB
        await db.collection('alignments').add({ teamCode, role, name, understanding, analysis, timestamp: new Date() });
        res.json({ success: true, analysis });

    } catch (e) {
        console.error("Server Error:", e);
        res.status(500).json({ error: e.message });
    }
});
// ▲▲▲ END FIXED ROUTE ▲▲▲

// Restore other routes (Unchanged)
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