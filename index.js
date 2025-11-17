// TOP OF FILE:
const express = require('express');
const { GoogleGenAI } = require('@google/genai'); // Line 2

// --- Start of Implementation for Step 2.3 (CLEANED) ---
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY}); 
const model = 'gemini-2.5-flash';
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
const app = express();
// Middleware to tell Express to automatically parse incoming JSON data from the user
app.use(express.json()); 

// --- End of Implementation for Step 4 ---


/**
 * I understand that this is to check for the errors for this project but not sure if it is correct. 
 * W
 * 
 */

// --- Start of Implementation for Step 5 ---

app.post('/clarity-check', async (req, res) => {
    // Extract 'topic' and 'understanding' from the user's JSON request body
    const { topic, understanding } = req.body;
  
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
        ${topic}
        CURRENT SHARED UNDERSTANDING: ${understanding}
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

// Define the required host interface for container environments
const HOST = '0.0.0.0'; 

// Basic health check endpoint (optional but helpful for Cloud Run health checks)
app.get('/', (req, res) => {
    res.send('<p>Clarity Meter AI is running. Send a POST request to /clarity-check.</p>');
});

// Starts the server listening on the assigned port and host
app.listen(port, HOST, () => {
    console.log(`Clarity Meter AI listening on port ${port} and host ${HOST}`);
});

// --- End of Implementation for Step 7 (FINAL FIX) ---
// ----------------------------------------------------