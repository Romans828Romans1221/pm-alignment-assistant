const { VertexAI } = require('@google-cloud/vertexai');

// 1. SETUP
const PROJECT_ID = 'clarity-pm-assistant-gcp';
const LOCATION = 'us-east1'; // Updated to match index.js
const MODEL_NAME = 'gemini-1.5-flash';

async function testBrain() {
    console.log("--------------------------------------");
    console.log("🧠 TESTING AI CONNECTION...");
    console.log(`🔹 Project: ${PROJECT_ID}`);
    console.log(`🔹 Model:   ${MODEL_NAME}`);
    console.log("--------------------------------------");

    try {
        // 2. CONNECT
        const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
        const model = vertex_ai.preview.getGenerativeModel({ model: MODEL_NAME });

        // 3. SEND MESSAGE
        const prompt = "Hello! Are you working? Reply with 'Yes, I am online.'";
        console.log("📤 Sending prompt to Google...");

        const result = await model.generateContent(prompt);
        const response = result.response.candidates[0].content.parts[0].text;

        // 4. SUCCESS
        console.log("✅ SUCCESS! The AI replied:");
        console.log(`>> "${response.trim()}"`);
        console.log("--------------------------------------");

    } catch (error) {
        // 5. FAILURE DIAGNOSIS
        console.log("❌ FAILURE. Here is the exact reason:");
        console.error(error.message);

        if (error.message.includes("404")) {
            console.log("\n💡 FIX: The API is likely OFF. Run this command:");
            console.log("   gcloud services enable aiplatform.googleapis.com");
        }
        if (error.message.includes("403") || error.message.includes("credential")) {
            console.log("\n💡 FIX: You are logged out. Run this command:");
            console.log("   gcloud auth application-default login");
        }
        console.log("--------------------------------------");
    }
}

testBrain();
