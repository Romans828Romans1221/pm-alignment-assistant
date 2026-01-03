const { VertexAI } = require('@google-cloud/vertexai');

// configuration
const project = 'clarity-pm-assistant-gcp';
const location = 'us-central1';

async function listModels() {
    console.log(`🔍 Checking inventory for Project: ${project} in ${location}...`);
    try {
        const vertex_ai = new VertexAI({ project: project, location: location });
        // We initialize the client but do the real testing below

        // There isn't a simple "list models" function in the Node SDK yet, 
        // so we test the most common "Aliased" names to see which one bites.
        const candidates = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro',
            'gemini-pro',
            'gemini-flash'
        ];

        console.log("\n🧪 Testing Connection to Models:");

        for (const modelName of candidates) {
            try {
                process.stdout.write(`   👉 Testing '${modelName}'... `);
                const model = vertex_ai.preview.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log("✅ AVAILABLE!");
            } catch (e) {
                if (e.message.includes('404')) {
                    console.log("❌ Not Found");
                } else {
                    console.log(`⚠️ Error: ${e.message.split('\n')[0]}`); // logging first line of error for brevity
                }
            }
        }

    } catch (e) {
        console.error("🔥 CRITICAL API ERROR:", e.message);
    }
}

listModels();
