// --- 1. IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 2. CONFIGURATION (PASTE YOUR KEYS HERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyDRRfZDyVMpq5t6BNCyEf6M4Dx1rcMAVLE",
    authDomain: "clarity-pm-assistant-gcp.firebaseapp.com",
    projectId: "clarity-pm-assistant-gcp",
    storageBucket: "clarity-pm-assistant-gcp.firebasestorage.app",
    messagingSenderId: "132738195526",
    appId: "1:132738195526:web:2e13fb7c6012e1204c6a47",
};

// --- 3. INITIALIZE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;
// Your Cloud Run URL (No slash at the end)
// UPDATE THIS LINE:
const API_URL = 'https://clarity-pm-assistant-132738195526.us-central1.run.app';

// --- 4. GATEKEEPER (PROTECTS THE PAGE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        console.log("User verified:", user.email);
        currentUser = user;
        
        // Update UI
        const userNameDisplay = document.getElementById('user-name');
        if(userNameDisplay) userNameDisplay.textContent = user.displayName || user.email;

        // Load History
        loadUserGoals(user.email);
        
    } else {
        // User is NOT logged in -> Kick to Login Page
        console.log("No user found. Redirecting...");
        window.location.href = 'login.html';
    }
});

// --- 5. LOGOUT LOGIC ---
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => console.error("Logout error:", error));
    });
}

// --- 6. MAIN APP LOGIC ---
const form = document.getElementById('clarityForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        if (!currentUser) {
            alert("You must be logged in.");
            return;
        }

        const topic = document.getElementById('topicInput').value;
        const understanding = document.getElementById('understandingInput').value;
        const resultDiv = document.getElementById('result');

        resultDiv.innerHTML = '<h2>Analyzing...</h2><p>Please wait...</p>';

        try {
            // A. Call Clarity API
            const response = await fetch(`${API_URL}/clarity-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, understanding }),
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            
            // B. Save to Database
            await fetch(`${API_URL}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: topic,
                    timeframe: "Instant Check",
                    user: currentUser.email 
                })
            });

            // Refresh History List
            loadUserGoals(currentUser.email);

            // C. Display Results
            let color = '#006400';
            if (data.verdict.includes('CLARITY REQUIRED')) color = '#FFA500';
            else if (data.verdict.includes('CRITICAL')) color = '#8B0000';

            resultDiv.innerHTML = `
                <h2>Clarity Check Complete!</h2>
                <p><strong>Verdict:</strong> <span style="color:${color}; font-weight:bold;">${data.verdict}</span></p>
                <p><strong>Score:</strong> ${data.clarity_score}/10</p>
                <h3>Insights:</h3>
                <ul>${data.gaps_insights.map(g => `<li>${g}</li>`).join('')}</ul>
            `;

        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            console.error(error);
        }
    });
}

// --- 7. DASHBOARD HISTORY LOGIC ---
async function loadUserGoals(email) {
    const listContainer = document.getElementById('goals-list');
    if (!listContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/api/goals?user=${encodeURIComponent(email)}`);
        const goals = await response.json();

        if (goals.length === 0) {
            listContainer.innerHTML = '<p>No history found.</p>';
            return;
        }

        listContainer.innerHTML = goals.map(goal => `
            <div style="background: #fff; padding: 10px; margin-bottom: 10px; border-left: 4px solid #4285F4; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <strong>${goal.title}</strong><br>
                <span style="color:#666; font-size:0.9em">${new Date(goal.createdAt._seconds * 1000).toLocaleDateString()}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error("History load error:", error);
    }
}

// --- 8. RE-ADD 3D BACKGROUND (Optional) ---
// (You can paste the 3D donut code here if you want it back)
// --- 8. REPORT GENERATOR LOGIC ---
const reportBtn = document.getElementById('generateReportBtn');
const reportOutput = document.getElementById('report-output');

if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
        if (!currentUser) return alert("Please log in.");
        
        reportOutput.style.display = 'block';
        reportOutput.innerHTML = '<p>🧠 AI is analyzing your history and writing a report...</p>';

        try {
            const response = await fetch(`${API_URL}/api/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser.email })
            });
            
            const data = await response.json();
            
            // Display the AI's response
            reportOutput.innerHTML = `
                <h3 style="margin-top:0; color:#673AB7;">📝 AI Weekly Summary</h3>
                ${data.report}
            `;
            
        } catch (error) {
            console.error(error);
            reportOutput.innerHTML = '<p style="color:red">Failed to generate report.</p>';
        }
    });
}