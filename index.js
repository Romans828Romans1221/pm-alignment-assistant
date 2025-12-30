const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');
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

// 3. AI CONFIGURATION
// We use the stable alias 'gemini-1.5-flash' to avoid version 404 errors.
const PROJECT_ID = 'clarity-pm-assistant-gcp';
const LOCATION = 'us-central1';
const MODEL_NAME = 'gemini-1.5-flash';

// --- API ROUTES ---

// A. GENERATE PLAN (The "Fail-Safe" Version)
app.post('/api/generate-plan', async (req, res) => {
    const { projectGoal, teamRoles, teamCode } = req.body;
    let aiPlan = null;

    // 🛡️ SANITIZATION FIX: Remove invisible spaces immediately
    const cleanCode = teamCode ? teamCode.trim() : null;

    try {
        console.log(`[1/3] Saving Goal for Team: '${cleanCode}'`);

        // ---------------------------------------------------------
        // STEP 1: SAVE TO DATABASE (CRITICAL PATH)
        // This runs FIRST. Even if AI fails later, the Link will work.
        // ---------------------------------------------------------
        if (cleanCode) {
            await db.collection('goals').add({
                teamCode: cleanCode, // <--- Saves "Charlie" (no space)
                goal: projectGoal,
                context: teamRoles || "No additional context provided.",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Goal saved to database successfully.");
        }

        // ---------------------------------------------------------
        // STEP 2: ATTEMPT AI GENERATION (OPTIONAL PATH)
        // If this fails (404, No Access, etc.), we catch the error 
        // and continue so the user isn't blocked.
        // ---------------------------------------------------------
        try {
            console.log(`[2/3] Attempting AI Generation...`);
            const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
            const model = vertex_ai.preview.getGenerativeModel({ model: MODEL_NAME });

            const prompt = `
                Act as a Project Manager.
                Goal: "${projectGoal}"
                Context: "${teamRoles}"
                Return JSON: { "projectName": "Short Title", "tasks": ["Task 1", "Task 2"] }
            `;

            const result = await model.generateContent(prompt);
            let text = result.response.candidates[0].content.parts[0].text;
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiPlan = JSON.parse(text);
            console.log("✅ AI Plan Generated.");

        } catch (innerError) {
            // THIS IS THE FIX: We log the error, but we do NOT crash the server.
            console.warn("⚠️ AI Failed (Non-Fatal):", innerError.message);
            console.warn("⚠️ Continuing process so the Member Link still works.");
        }

        // STEP 3: RETURN SUCCESS
        // We return success because the PRIMARY job (saving the goal) is done.
        res.json({
            success: true,
            plan: aiPlan,
            message: "Goal saved!"
        });

    } catch (fatalError) {
        console.error("❌ Fatal Database Error:", fatalError);
        res.status(500).json({ error: "Failed to save to database." });
    }
});

// B. FETCH GOALS (Updated to fix "Goal Not Found")
app.get('/api/goals', async (req, res) => {
    try {
        const code = req.query.code || req.query.teamCode;
        if (!code) return res.status(400).json({ error: "No code" });

        // 🛡️ TRIM THE INPUT (Just in case)
        const cleanCode = code.trim();

        // 🔍 SIMPLIFIED QUERY
        // We removed .orderBy('timestamp', 'desc') because it requires a manual database index.
        const snapshot = await db.collection('goals')
            .where('teamCode', '==', cleanCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log(`❌ Goal not found for code: '${cleanCode}'`);
            return res.json({ success: false });
        }

        const data = snapshot.docs[0].data();
        console.log(`✅ Goal found for: '${cleanCode}'`);
        res.json({ success: true, goal: data.goal, context: data.context });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// C. ANALYZE ALIGNMENT (The Clarity Check)
app.post('/api/analyze-alignment', async (req, res) => {
    try {
        const { teamCode, role, understanding } = req.body;

        // 1. Get Leader Goal
        const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: "Goal not found" });
        const leaderGoal = snapshot.docs[0].data().goal;

        // 2. Ask AI (With Fail-Safe)
        let analysis = { score: 0, meetingType: "Error", feedback: "AI Service Unavailable" };

        try {
            const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
            const model = vertex_ai.preview.getGenerativeModel({ model: MODEL_NAME });

            const prompt = `Compare Leader Goal: "${leaderGoal}" vs Member Understanding: "${understanding}". Return JSON: { "score": 85, "meetingType": "None", "feedback": "..." }`;
            const result = await model.generateContent(prompt);
            let text = result.response.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(text);
        } catch (aiErr) {
            console.error("AI Analysis Failed:", aiErr);
            // Fallback if AI fails:
            analysis = {
                score: 50,
                meetingType: "Needs Review",
                feedback: "AI could not process this request, but your response has been saved for the leader."
            };
        }

        // 3. Save Result
        await db.collection('alignments').add({ teamCode, role, understanding, analysis, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        res.json({ success: true, analysis });
    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. REACT CATCH-ALL (Safe Version)
// We use app.use here to avoid PathError with '*' on this system
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});