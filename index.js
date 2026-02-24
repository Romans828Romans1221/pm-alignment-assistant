/* --- 1. CORE CONFIGURATION --- */
require('dotenv').config(); // Loads local .env for development
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
app.use(cors());
app.use(express.json()); // Essential for reading req.body
app.use(express.static(path.join(__dirname, 'dist')));

/* --- 2. DATABASE & AI SETUP --- */
try {
    admin.initializeApp();
} catch (e) {
    // Already initialized
}
const db = getFirestore();

// Use the API key specifically from your config object
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || "MISSING_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/* --- 3. THE UNIFIED API ROUTE --- */
// This merges the Validation Shield with your AI Business Logic
app.post('/api/analyze-alignment', async (req, res) => {
    try {
        const { teamCode, role, name, understanding, goal, context, deviceId } = req.body;

        // --- INTERNAL AI ENGINE ---
        const proceedToAI = async () => {
            console.log("\n📦 PACKET RECEIVED:", name);
            let leaderGoal = goal;
            let leaderContext = context || "";

            if (!leaderGoal) {
                console.log("🔍 Goal missing in body. Searching DB for code:", teamCode);
                const snapshot = await db.collection('goals').where('teamCode', '==', teamCode).limit(1).get();
                if (snapshot.empty) {
                    return res.status(404).json({ error: "Goal not found in database." });
                }
                leaderGoal = snapshot.docs[0].data().goal;
                leaderContext = snapshot.docs[0].data().context || "";
            }

            console.log("🧠 Calling Gemini AI...");
            const prompt = `
                Leader Goal: "${leaderGoal}"
                Context: "${leaderContext}"
                Member (${name}, ${role}) Understanding: "${understanding}"
                Compare them. Return strictly this JSON: 
                { "score": (0-100), "meetingType": "None" or "1:1 Meeting", "feedback": "Short advice" }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(text);

            await db.collection('alignments').add({
                teamCode, role, name, understanding, analysis, timestamp: new Date()
            });

            return res.json({ success: true, analysis });
        };

        // --- 1. THE MASTER KEY CHECK ---
        if (teamCode === 'ClarityAdmin2026') {
            console.log("🔑 MASTER KEY DETECTED: Skipping all usage limits.");
            return proceedToAI();
        }

        // --- 2. REGULAR USER TRACKING ---

        // Check Device Limit (Prevent abuse)
        if (deviceId) {
            const deviceRef = db.collection('device-usage').doc(deviceId);
            const deviceDoc = await deviceRef.get();
            if (deviceDoc.exists && deviceDoc.data().totalFreeChecks >= 15 && !deviceDoc.data().isDevDevice) {
                return res.status(402).json({ error: "Device Limit Reached", message: "This device has reached the maximum free checks." });
            }
            // Increment Device Usage
            await deviceRef.set({
                totalFreeChecks: (deviceDoc.data()?.totalFreeChecks || 0) + 1,
                lastUsed: new Date()
            }, { merge: true });
        }

        // Check Team Code Limit (Strategic Paywall - 21 Uses)
        const usageRef = db.collection('team-usage').doc(teamCode);
        const usageDoc = await usageRef.get();
        if (usageDoc.exists && usageDoc.data().count >= 21 && !usageDoc.data().isPro) {
            return res.status(402).json({
                error: "Team Limit Reached",
                message: "This team has used its 21 free checks. Upgrade to Clarity Pro!"
            });
        }

        // --- 3. RECORD USER USAGE ---
        await usageRef.set({
            count: (usageDoc.data()?.count || 0) + 1,
            lastUsed: new Date()
        }, { merge: true });

        return proceedToAI();

    } catch (e) {
        console.error("❌ Usage Guard Error:", e);
        res.status(500).json({ error: "Server Error", message: e.message });
    }
});

/* --- STRIPE CHECKOUT ROUTE --- */
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { teamCode } = req.body;
        if (!teamCode) {
            return res.status(400).json({ error: "Team code is required" });
        }
        console.log(`💳 Creating Stripe Checkout for Team: ${teamCode}`);
        // Generate the Stripe hosted payment page
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Clarity Pro - Team Upgrade',
                            description: `Unlimited alignment checks for team code: ${teamCode}`,
                        },
                        unit_amount: 4900, // $49.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Redirects after payment success or cancellation
            success_url: `${req.headers.origin}/leader?code=${teamCode}&upgrade=success`,
            cancel_url: `${req.headers.origin}/leader?code=${teamCode}`,
            // IMPORTANT: Tags the payment to this specific team
            client_reference_id: teamCode,
            metadata: { teamCode: teamCode }
        });
        // Send the secure Stripe URL back to the frontend
        res.json({ url: session.url });
    } catch (e) {
        console.error("❌ Stripe Checkout Error:", e);
        res.status(500).json({ error: "Could not create checkout session" });
    }
});

/* --- UPGRADE VERIFICATION ROUTE --- */
app.post('/api/verify-upgrade', async (req, res) => {
    try {
        const { teamCode } = req.body;
        if (!teamCode) return res.status(400).json({ error: "Team code missing" });
        console.log(`🔓 Unlocking Clarity Pro for team: ${teamCode}`);

        // Flip the switch in Firestore to unlimited
        await db.collection('team-usage').doc(teamCode).set({
            isPro: true,
            upgradedAt: new Date()
        }, { merge: true });
        res.json({ success: true, message: "Team upgraded successfully!" });
    } catch (e) {
        console.error("❌ Upgrade Error:", e);
        res.status(500).json({ error: "Failed to verify upgrade" });
    }
});

/* --- 4. ADDITIONAL ROUTES --- */
app.get('/api/health', (req, res) => {
    res.json({
        status: "Online",
        // Use the variable you defined at the top of the file
        mode: NODE_ENV === 'production' ? "Production" : "Development"
    });
});

// Serve the frontend PWA for any non-API route
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));