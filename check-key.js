require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// We pull the key from .env so you don't have to paste it again
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey.includes("YourKey")) {
    console.error("❌ KEY MISSING: Please check your .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkInventory() {
    console.log("🔍 Checking API Key Inventory...");
    try {
        // This asks Google: "What models can I use?"
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("👉 Testing 'gemini-1.5-flash'...");
        const result = await model.generateContent("Hello");
        console.log("✅ SUCCESS! 'gemini-1.5-flash' is working.");
        console.log("Response:", result.response.text());

    } catch (error) {
        console.log("❌ FAILURE.");
        console.error(error.message);

        if (error.message.includes("404")) {
            console.log("\n💡 DIAGNOSIS: The 'Generative Language API' is likely OFF.");
            console.log("Run this: gcloud services enable generativelanguage.googleapis.com");
        }
    }
}

checkInventory();
