require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// We read from .env for security and ease of use
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.log("❌ ERROR: GEMINI_API_KEY is missing from .env");
    console.log("Please add your key to the .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName) {
    process.stdout.write(`👉 Testing '${modelName}'... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log("✅ SUCCESS!");
        return true;
    } catch (e) {
        if (e.message.includes("404")) {
            console.log("❌ Not Found (404)");
        } else {
            console.log(`⚠️ Error: ${e.message.split('[')[0]}`);
        }
        return false;
    }
}

async function run() {
    console.log("🔍 Scanning for available models...");

    // We test the most common names
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const name of candidates) {
        const success = await testModel(name);
        if (success) {
            console.log(`\n🎉 WE FOUND IT! Update your index.js to use: "${name}"`);
            return;
        }
    }

    console.log("\n⛔ FAILURE: All models returned 404.");
    console.log("This means your API Key was created inside the OLD (Blocked) Project.");
    console.log("Solution: Go back to Google AI Studio -> Create Key -> Select 'New Project'.");
}

run();
