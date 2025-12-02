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
  measurementId: "G-WGBLXJMTS8"
};

// --- 3. INITIALIZE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUser = null;
const API_URL = 'https://clarity-pm-assistant-132738195526.us-central1.run.app'; // Check this URL matches your deployed service

// --- 4. URL PARAMETER LOGIC (THE FIX) ---
// This runs as soon as the page is ready. It grabs the ?topic=... from the URL.
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('topic');
    const sharedTeam = params.get('team');

    // If there is a topic in the URL, fill the box and lock it
    if (sharedTopic) {
        const topicInput = document.getElementById('topicInput');
        if (topicInput) {
            topicInput.value = decodeURIComponent(sharedTopic);
            topicInput.setAttribute('readonly', 'true');
            topicInput.style.backgroundColor = '#f0f4f8'; // Light grey to show it's locked
            topicInput.style.color = '#555';
            topicInput.style.cursor = 'not-allowed';
            
            // Update the label to let them know why it's locked
            const label = document.querySelector('label[for="topicInput"]');
            if(label) label.innerHTML = "🔒 <strong>LEADER'S GOAL (READ ONLY):</strong>";
        }
    }

    // If there is a team code, fill that too
    if (sharedTeam) {
        const teamInput = document.getElementById('teamInput');
        if (teamInput) teamInput.value = decodeURIComponent(sharedTeam);
    }
});

// --- 5. GATEKEEPER (PROTECTS THE PAGE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User verified:", user.email);
        currentUser = user;
        
        const userNameDisplay = document.getElementById('user-name');
        if(userNameDisplay) userNameDisplay.textContent = user.displayName || user.email;

        loadUserGoals(user.email); // Load history
        
    } else {
        window.location.href = 'login.html'; // Redirect if not logged in
    }
});

// --- 6. LOGOUT LOGIC ---
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => console.error("Logout error:", error));
    });
}

// --- 7. MAIN APP LOGIC (SUBMIT CHECK) ---
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
        const role = document.getElementById('roleInput') ? document.getElementById('roleInput').value : "Unspecified";
        
        // Fix for Team Code
        const teamInput = document.getElementById('teamInput');
        const teamCode = teamInput ? teamInput.value.trim() : "Personal";
        
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
            const goalPayload = {
                title: topic,
                timeframe: "Instant Check",
                user: currentUser.email,
                teamId: teamCode, 
                role: role
            };

            await fetch(`${API_URL}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalPayload)
            });

            // Refresh History
            if (teamCode && teamCode !== "Personal") {
                loadTeamGoals(teamCode);
            } else {
                loadUserGoals(currentUser.email);
            }

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

// --- 8. CREATE SHAREABLE LINK (ADMIN FEATURE) ---
const shareBtn = document.getElementById('shareGoalBtn');
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const topic = document.getElementById('topicInput').value.trim();
        const team = document.getElementById('teamInput').value.trim();
        
        if (!topic) return alert("Please enter a Meeting Topic/Goal first.");

        // Encode and Build Link
        const encodedTopic = encodeURIComponent(topic);
        const encodedTeam = encodeURIComponent(team);
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?topic=${encodedTopic}&team=${encodedTeam}`;
        
        const container = document.getElementById('shareLinkContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <strong>Share this with your team:</strong><br>
            <input type="text" value="${link}" style="width:100%; padding:5px; margin-top:5px;" onclick="this.select()">
        `;
    });
}

// --- 9. HISTORY & REPORT LOGIC (Keep existing functions) ---
// Paste your loadUserGoals, loadTeamGoals, and Report Generator logic here if they aren't already part of the block above.
// (For brevity, I am assuming you keep your existing helper functions at the bottom)
async function loadUserGoals(email) { /* ... existing code ... */ }
async function loadTeamGoals(teamCode) { /* ... existing code ... */ }

// Report Generator
const reportBtn = document.getElementById('generateReportBtn');
const reportOutput = document.getElementById('report-output');
if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
        if (!currentUser) return alert("Please log in.");
        reportOutput.style.display = 'block';
        reportOutput.innerHTML = '<p>🧠 AI is analyzing...</p>';
        try {
            const response = await fetch(`${API_URL}/api/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser.email })
            });
            const data = await response.json();
            reportOutput.innerHTML = `<h3 style="margin-top:0;">📝 AI Summary</h3>${data.report}`;
        } catch (error) {
            reportOutput.innerHTML = '<p style="color:red">Failed to generate report.</p>';
        }
    });
}