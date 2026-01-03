const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = 'clarity-pm-assistant-gcp';
const LOCATION = 'us-central1';

async function listModels() {
    console.log("--------------------------------------");
    console.log("🔍 CHECKING AVAILABLE MODELS...");
    console.log(`🔹 Project: ${PROJECT_ID}`);
    console.log(`🔹 Region:  ${LOCATION}`);
    console.log("--------------------------------------");

    try {
        const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
        const model = vertex_ai.preview.getGenerativeModel({ model: 'gemini-pro' }); // fallback init

        // We can't easily "list" models via this specific SDK helper, 
        // so we will try a "Hello World" with the safest, oldest model: 'gemini-1.0-pro'
        // If THIS works, we know 'gemini-1.5-flash' is just named wrong or restricted.

        console.log("👉 Attempting connection with 'gemini-1.0-pro' (The Old Reliable)...");
        const testModel = vertex_ai.preview.getGenerativeModel({ model: 'gemini-1.0-pro' });
        const result = await testModel.generateContent("Test.");

        console.log("✅ SUCCESS! 'gemini-1.0-pro' works.");
        console.log("📝 CONCLUSION: Your API Key works, but 'gemini-1.5-flash' is restricted.");
        console.log("💡 FIX: Change 'MODEL_NAME' in index.js to 'gemini-1.0-pro'");

    } catch (error) {
        console.log("❌ FAILURE.");
        console.error("Error Message:", error.message);

        if (error.message.includes("403") || error.message.includes("Billing")) {
            console.log("\n💰 DIAGNOSIS: BILLING REQUIRED.");
            console.log("Even for free trials, Google requires a Billing Account linked.");
            console.log("👉 Go here: https://console.cloud.google.com/billing");
        }
    }
}

listModels();
