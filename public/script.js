// --- 1. IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// --- 0. CHECK URL PARAMS (RUNS IMMEDIATELY) ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('topic');
    const sharedTeam = params.get('team');

    if (sharedTopic) {
        const topicInput = document.getElementById('topicInput');
        if (topicInput) {
            // 1. Fill the input
            topicInput.value = decodeURIComponent(sharedTopic);

            // 2. LOCK IT (Visual cues)
            topicInput.setAttribute('readonly', 'true');
            topicInput.style.backgroundColor = '#f8f9fa';
            topicInput.style.border = '2px solid #673AB7'; // Purple border to show it's special
            topicInput.style.color = '#555';

            // 3. Update the Label
            const label = document.querySelector('label[for="topicInput"]');
            if (label) label.innerHTML = "🔒 <strong>LEADER'S GOAL (READ ONLY):</strong>";
        }
    }

    if (sharedTeam) {
        const teamInput = document.getElementById('teamInput');
        if (teamInput) teamInput.value = decodeURIComponent(sharedTeam);
    }
});


// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Failed', err));
    });
}


// --- MEMBER VIEW: READ URL PARAMS ---
const shareBtn = document.getElementById('shareGoalBtn');
const params = new URLSearchParams(window.location.search);
const sharedTopic = params.get('topic');
const sharedTeam = params.get('team');

if (sharedTopic) {
    const topicInput = document.getElementById('topicInput');
    topicInput.value = decodeURIComponent(sharedTopic);

    // LOCK THE GOAL (Crucial for Leader control)
    topicInput.setAttribute('readonly', 'true');
    topicInput.style.backgroundColor = '#f5f5f5';
    topicInput.style.cursor = 'not-allowed';

    // Change Label
    document.querySelector('label[for="topicInput"]').innerHTML = "🔒 <strong>Leader's Goal:</strong>";

    // Hide the "Create Link" button for members (they don't need it)
    if (shareBtn) shareBtn.style.display = 'none';
}

if (sharedTeam) {
    document.getElementById('teamInput').value = decodeURIComponent(sharedTeam);
}



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
        if (userNameDisplay) userNameDisplay.textContent = user.displayName || user.email;

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
if (logoutBtn) {
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

        // --- ADD THIS LINE TO FIX THE ERROR ---
        const teamCode = document.getElementById('teamInput').value.trim();



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
            const role = document.getElementById('roleInput').value; // Get the role

            const goalPayload = {
                title: topic,
                timeframe: "Instant Check",
                user: currentUser.email,
                teamId: teamCode || "personal",
                role: role // <--- NEW: Send the role!
            };

            await fetch(`${API_URL}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalPayload)
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

        // UPDATED HTML TEMPLATE:
        listContainer.innerHTML = goals.map(goal => `
            <div style="background: #fff; padding: 12px; margin-bottom: 10px; border-left: 4px solid #4285F4; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <strong>${goal.title}</strong>
                    <span style="font-size:0.75em; background:#eee; padding:2px 6px; border-radius:4px; color:#555;">
                        ${goal.teamId || 'Personal'}
                    </span>
                </div>
                <div style="font-size:0.85em; color:#666;">
                    Role: ${goal.role || 'N/A'} &bull; ${new Date(goal.createdAt._seconds * 1000).toLocaleDateString()}
                </div>
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

// --- TEAM DASHBOARD LOGIC ---
async function loadTeamGoals(teamCode) {
    const listContainer = document.getElementById('goals-list');
    listContainer.innerHTML = `<p style="color:#00796b;">Loading history for Team: <strong>${teamCode}</strong>...</p>`;

    try {
        // Call the new backend endpoint
        const response = await fetch(`${API_URL}/api/team-goals?team=${encodeURIComponent(teamCode)}`);
        const goals = await response.json();

        if (goals.length === 0) {
            listContainer.innerHTML = `<p>No history found for team "${teamCode}". Start the first check!</p>`;
            return;
        }

        // Render the list (Green styling for Team view)
        listContainer.innerHTML = goals.map(goal => `
            <div style="background: #f0f8ff; padding: 15px; margin-bottom: 10px; border-left: 4px solid #00796b; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong style="color:#004d40;">${goal.title}</strong>
                    <span style="font-size:0.8em; background:#e0f2f1; padding:2px 6px; border-radius:4px;">${goal.user}</span>
                </div>
                <div style="color:#666; font-size:0.9em">
                    Timeframe: ${goal.timeframe} <br>
                    Date: ${new Date(goal.createdAt._seconds * 1000).toLocaleDateString()}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Team Load Error:", error);
        listContainer.innerHTML = '<p style="color:red">Failed to load team history.</p>';
    }
}

// Listen for typing in the Team Input box
const teamInput = document.getElementById('teamInput');
if (teamInput) {
    teamInput.addEventListener('change', (e) => {
        const code = e.target.value.trim();
        if (code) loadTeamGoals(code);
        else loadUserGoals(currentUser.email); // Go back to personal view if empty
    });
}

// --- ADMIN: CREATE SHAREABLE LINK ---
if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const topic = document.getElementById('topicInput').value.trim();
        const team = document.getElementById('teamInput').value.trim();

        if (!topic) return alert("Please enter a Meeting Topic/Goal first.");

        // 1. Robust Encoding
        const encodedTopic = encodeURIComponent(topic);
        const encodedTeam = encodeURIComponent(team);

        // 2. Build Clean URL
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?topic=${encodedTopic}&team=${encodedTeam}`;

        // 3. Display and Auto-Select
        const container = document.getElementById('shareLinkContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <strong>Share this link:</strong><br>
            <input type="text" value="${link}" style="width:100%; padding:5px; margin-top:5px;" onclick="this.select()">
        `;
    });
}