require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKey() {
    console.log("--------------------------------------");
    console.log("🔑 TESTING API KEY...");

    const key = process.env.GEMINI_API_KEY || "";
    console.log(`🔑 Key Length: ${key.length}`);
    // Show first 5 and last 3 chars to verify pasting (without revealing full key)
    if (key.length > 10) {
        console.log(`🔑 Key Start:  ${key.substring(0, 5)}...`);
        console.log(`🔑 Key End:    ...${key.substring(key.length - 3)}`);
    } else {
        console.log("🔑 Key:        (Too short to be valid)");
    }

    if (!key || key.startsWith("AIzaSy...YourKey") || key.includes("YourKeyHere")) {
        console.log("❌ FAILURE: You haven't replaced the placeholder key in .env!");
        return;
    }

    const candidateModels = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of candidateModels) {
        console.log(`\n👉 Testing Model: "${modelName}"...`);
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent("Test.");
            const response = await result.response;
            console.log(`✅ SUCCESS! Found working model: "${modelName}"`);
            console.log("--------------------------------------");
            return;
        } catch (e) {
            // Print error but strip huge stack traces
            console.log(`❌ Failed (${modelName}): ${e.message.split('[')[0]}`);
        }
    }
    console.log("\n❌ ALL FAILED. Please double-check your API Key in .env");
    console.log("Make sure there are no spaces or quotes around it.");
    console.log("--------------------------------------");
}

testKey();
