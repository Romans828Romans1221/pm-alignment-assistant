const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

//initialize app 
const app = express();
app.use(cors());
app.use(express.json());



// Initialize Firebase Admin SDK (uses Cloud Run's default service account)
admin.initializeApp();
const db = getFirestore();
// ... rest of your code ...
//Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash';

// --- Add after your Gemini model declaration (around line 9) ---


// --- Continue with your existing code below ---

// --- End of Implementation for Step 2.3 ---
// ... rest of your server setup will follow

// --- Start of Implementation for Step 3 ---

// 3.1 & 3.2: Defining the Constant and the AI's Role
const BASE_PROMPT = `
You are an expert clarity analyst. Your task is to evaluate whether a proposed meeting is necessary based on two provided text inputs: the MEETING TOPIC and the CURRENT SHARED UNDERSTANDING.

Follow these steps:
1.  **Clarity Score (0-10):** Assign a single numerical score (0-10, where 0 is 'Total Confusion' and 10 is 'Perfect Clarity') based on how well the 'Shared Understanding' addresses the 'Meeting Topic'.
2.  **Verdict:** Based on the score, give a concise verdict:
    * **Score 8-10:** Verdict: 'MEETING UNNECESSARY - RESOLVE VIA EMAIL/DOC.'
    * **Score 5-7:** Verdict: 'CLARITY REQUIRED - FOCUS ON GAPS.'
    * **Score 0-4:** Verdict: 'MEETING CRITICAL - HIGHLY RECOMMENDED.'
3.  **Gaps/Actionable Insights:** Identify 3-4 specific, concrete areas of misunderstanding, missing information, or process steps that need to be clarified to achieve a score of 10.
    

4.  **Output Format:** ONLY output a single, valid JSON object. Do not include any other text, pre-amble, or markdown formatting outside of the JSON object.
5.  **JSON Schema:** The JSON object must strictly follow this structure: {"clarity_score": number, "verdict": string, "gaps_insights": [string, string, string]}


Input:
MEETING TOPIC: 
`;
// We intentionally end the template literal here. The user's input will be appended 
// to this prompt string later in the POST handler (Phase 2).

// --- End of Implementation for Step 3 ---

// --- Start of Implementation for Step 4 ---

// Define the port Cloud Run will use (it's always the PORT environment variable)
const port = process.env.PORT || 8080;

// Initializes the Express server


// --- End of Implementation for Step 4 ---


/**
 * I understand that this is to check for the errors for this project but not sure if it is correct. 
 * W
 * 
 */

// --- Start of Implementation for Step 5 ---

app.post('/clarity-check', async (req, res) => {
    // Extract 'topic', 'understanding', and 'context' from the user's JSON request body
    const { topic, understanding, context } = req.body;

    if (!topic || !understanding) {
        // Return a 400 error if the user didn't send all required data
        return res.status(400).json({
            error: 'Error: Must provide both "topic" and "understanding" in the request body.'
        });
    }

    try {
        // Construct the final, complete prompt by appending the user's data 
        // to the BASE_PROMPT instructions (Phase 1, Step 3.4)
        const fullPrompt = BASE_PROMPT + `
        MEETING TOPIC/GOAL: ${topic}
        ADDITIONAL CONTEXT/BREAKDOWN: ${context || "N/A"}

        CURRENT SHARED UNDERSTANDING (Member's Input): ${understanding}
      `;

        // Call the Gemini model using the secure 'ai' client
        const response = await ai.models.generateContent({
            model: model, // 'gemini-2.5-flash'
            contents: fullPrompt,
            config: {
                // Re-enforce the JSON output requirement for the API call
                responseMimeType: "application/json",
            },
        });

        // Step 6: Handle Output - Parse the JSON string received from the AI
        const clarityResult = JSON.parse(response.text.trim());

        // Send the structured JSON analysis back to the user
        res.json(clarityResult);

    } catch (error) {
        console.error('AI Generation Error:', error);
        // Send a generic 500 server error if the AI call fails or the JSON parsing fails
        res.status(500).json({ error: 'An unexpected error occurred during clarity analysis.' });
    }
});

// --- End of Implementation for Step 5 ---
// // --- Start of Implementation for Step 7 (FINAL FIX) ---
// --- Step 3: New Endpoint to Save Goals to Database ---
// Line 120: // --- Step 3: New Endpoint to Save Goals to Database ---

// START PASTING HERE (Line 121)
// --- Step 3 & Goal 3: Smart Goal Save (With Role Guardrail) ---
// --- Step 3 & Goal 3: Save Goal + Clarity Results ---
app.post('/api/goals', async (req, res) => {
    // We now accept 'understanding', 'score', and 'verdict' too!
    const { title, timeframe, user, teamId, role, understanding, score, verdict } = req.body;

    if (!title) return res.status(400).json({ error: 'Missing goal title.' });

    try {
        // Save everything to Firestore
        const docRef = await db.collection('goals').add({
            title,
            timeframe: timeframe || "Instant Check",
            user,
            teamId: teamId || null,
            role: role || "Unspecified",
            understanding: understanding || "", // Save what they typed
            clarityScore: score || 0,           // Save the AI score
            verdict: verdict || "Pending",      // Save the AI verdict
            createdAt: admin.firestore.Timestamp.now()
        });

        res.status(201).json({
            message: 'Goal and results saved.',
            id: docRef.id
        });

    } catch (error) {
        console.error('Firestore Error:', error);
        res.status(500).json({ error: 'Failed to save goal.' });
    }
});
// STOP PASTING HERE

// --- SAFE GET GOALS ROUTE ---
app.get('/api/goals', async (req, res) => {
    const userEmail = req.query.user;
    console.log(`Fetching goals for user: ${userEmail}`); // LOGGING

    if (!userEmail) {
        console.error("Missing user email");
        return res.status(400).json({ error: 'Missing user email parameter.' });
    }

    try {
        const snapshot = await db.collection('goals')
            .where('user', '==', userEmail)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (snapshot.empty) {
            console.log("No goals found for user.");
            return res.json([]);
        }

        const goals = [];
        snapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Successfully fetched ${goals.length} goals.`);
        res.json(goals);

    } catch (error) {
        console.error('FULL FIRESTORE ERROR:', error); // CRITICAL: Log the full error object

        // If the error is about indexes, send that specific message
        if (error.message.includes("indexes")) {
            return res.status(500).json({ error: "Missing Firestore Index. Check logs for link." });
        }

        res.status(500).json({ error: 'Failed to fetch goals. See server logs.' });
    }
});

// --- Step 3: New Endpoint to GET Team Goals ---
app.get('/api/team-goals', async (req, res) => {
    const teamId = req.query.team; // Gets ?team=Team-Alpha

    if (!teamId) {
        return res.status(400).json({ error: 'Missing team parameter.' });
    }

    try {
        // Query Firestore: Find goals where 'teamId' matches
        const snapshot = await db.collection('goals')
            .where('teamId', '==', teamId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (snapshot.empty) {
            return res.json([]);
        }

        const goals = [];
        snapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });

        res.json(goals);

    } catch (error) {
        console.error('Team Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch team goals.' });
    }
});


// Define the required host interface for container environments
const HOST = '0.0.0.0';

// Basic health check endpoint (optional but helpful for Cloud Run health checks)
app.get('/', (req, res) => {
    res.send('<p>Clarity Meter AI is running. Send a POST request to /clarity-check.</p>');
});


// --- End of Implementation for Step 7 (FINAL FIX) ---
// ----------------------------------------------------


// --- Step 4: Smart AI Report (User OR Team) ---
app.post('/api/generate-report', async (req, res) => {
    const { user, teamId } = req.body; // Now we accept teamId too

    try {
        let snapshot;
        let contextMsg = "";

        // 1. Decide: Are we analyzing a Team or a Person?
        if (teamId) {
            console.log(`Generating report for Team: ${teamId}`);
            contextMsg = `TEAM REPORT (${teamId})`;
            snapshot = await db.collection('goals')
                .where('teamId', '==', teamId)
                .orderBy('createdAt', 'desc')
                .limit(15) // Look at last 15 team updates
                .get();
        } else {
            console.log(`Generating report for User: ${user}`);
            contextMsg = "INDIVIDUAL REPORT";
            snapshot = await db.collection('goals')
                .where('user', '==', user)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        }

        if (snapshot.empty) {
            return res.json({ report: "No recent activity found to analyze." });
        }

        // 2. Format data for the AI (Include Who and What)
        let historyText = `${contextMsg} ACTIVITY:\n`;
        snapshot.forEach(doc => {
            const data = doc.data();
            // We include the User's email so the AI knows WHO said WHAT
            historyText += `- [${data.user}] Goal: "${data.title}" | Role: "${data.role}" | Understanding: "${data.understanding || 'N/A'}" | Verdict: ${data.verdict}\n`;
        });

        // 3. Send to Gemini (Updated Prompt)
        const prompt = `
            You are an expert Project Management Assistant. 
            Analyze the following list of team inputs.
            
            Your Goal: Write a status summary for the Team Leader.
            
            1. Identify alignment: Does everyone understand the goal?
            2. Call out risks: Did specific members (list them by email/role) misunderstand their task?
            3. Verdict: Is the team ready to start?
            
            DATA:
            ${historyText}
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ report: result.response.text() });

    } catch (error) {
        console.error('Report Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
});// <-- This is the end of the Report Route (approx Line 249)


// --- Starts the server listening --- 
// (This block must be the VERY LAST thing in the file)
app.listen(port, HOST, () => {
    console.log(`Clarity Meter AI listening on port ${port} and host ${HOST}`);
});