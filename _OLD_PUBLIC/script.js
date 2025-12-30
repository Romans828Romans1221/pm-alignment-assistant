// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Failed', err));
    });
}

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
// --- 0. PAGE LOAD LOGIC (HANDLE LINKS) ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('topic');
    const sharedContext = params.get('context');
    const sharedTeam = params.get('team');

    // LOGIC FOR MEMBER PAGE
    if (window.location.pathname.includes('member.html')) {
        if (sharedTopic) {
            // 1. Show it to the human
            document.getElementById('displayTopic').textContent = decodeURIComponent(sharedTopic);
            // 2. Put it in the hidden box for the code
            document.getElementById('topicInput').value = decodeURIComponent(sharedTopic);
        }

        if (sharedContext) {
            document.getElementById('displayContext').textContent = decodeURIComponent(sharedContext);
            if (document.getElementById('contextInput')) {
                document.getElementById('contextInput').value = decodeURIComponent(sharedContext);
            }
        } else {
            document.getElementById('displayContext').textContent = "No additional context provided.";
        }

        if (sharedTeam) {
            document.getElementById('displayTeam').textContent = decodeURIComponent(sharedTeam);
            document.getElementById('teamInput').value = decodeURIComponent(sharedTeam);
        }
    }

    // LOGIC FOR LEADER PAGE (Auto-fill if they click their own link)
    else if (window.location.pathname.includes('leader.html')) {
        if (sharedTeam) {
            document.getElementById('teamInput').value = decodeURIComponent(sharedTeam);
            // Auto-load dashboard if team is present
            setTimeout(() => loadTeamGoals(decodeURIComponent(sharedTeam)), 1000);
        }
    }
});

// --- 5. GATEKEEPER (PROTECTS THE PAGE) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User verified:", user.email);
        currentUser = user;

        const userNameDisplay = document.getElementById('user-name');
        if (userNameDisplay) userNameDisplay.textContent = user.displayName || user.email;

        loadUserGoals(user.email); // Load history

    } else {
        window.location.href = 'login.html'; // Redirect if not logged in
    }
});

// --- 6. LOGOUT LOGIC ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
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

            // B. Save to Database (Now including the AI Results!)
            const goalPayload = {
                title: topic,
                timeframe: "Instant Check",
                user: currentUser.email,
                teamId: teamCode || "Personal",
                role: role,
                context: document.getElementById('contextInput') ? document.getElementById('contextInput').value : "",
                // --- NEW FIELDS ---
                understanding: understanding,     // What they wrote
                score: data.clarityScore || data.clarity_score,        // What AI rated them
                verdict: data.verdict             // What AI decided
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
const generateLinkBtn = document.getElementById('generateLinkBtn');
if (generateLinkBtn) {
    generateLinkBtn.addEventListener('click', () => {
        const topic = document.getElementById('topicInput').value;
        const context = document.getElementById('contextInput').value;
        const team = document.getElementById('teamInput').value;

        if (!topic || !team) return alert("Goal and Team Code are required.");

        // Point to member.html
        const baseUrl = window.location.origin + '/member.html';
        const link = `${baseUrl}?topic=${encodeURIComponent(topic)}&context=${encodeURIComponent(context)}&team=${encodeURIComponent(team)}`;

        const out = document.getElementById('shareLinkOutput');
        out.style.display = 'block';
        out.innerHTML = `<strong>Send to Team:</strong><br><input value="${link}" style="width:100%; padding:5px; margin-top:5px;" onclick="this.select()">`;
    });
}

// --- 9. HISTORY & REPORT LOGIC (Keep existing functions) ---
// Paste your loadUserGoals, loadTeamGoals, and Report Generator logic here if they aren't already part of the block above.
// (For brevity, I am assuming you keep your existing helper functions at the bottom)
async function loadUserGoals(email) {
    const listContainer = document.getElementById('goals-list');
    if (!listContainer) return;

    // Reset header
    const historyHeader = document.querySelector('.history-container h3');
    if (historyHeader) historyHeader.textContent = "My History";

    listContainer.innerHTML = '<p style="color: #888; font-size: 0.9em;">Loading...</p>';

    try {
        const response = await fetch(`${API_URL}/api/goals?user=${email}`);
        if (!response.ok) throw new Error("Failed to load goals");

        const goals = await response.json();
        renderGoals(listContainer, goals);

    } catch (error) {
        console.error("User Load Error:", error);
        listContainer.innerHTML = `<p style="color:red">Error loading history.</p>`;
    }
}

async function loadTeamGoals(teamCode) {
    const listContainer = document.getElementById('goals-list');
    if (!listContainer) return;

    // Update header to show we are looking at team goals
    const historyHeader = document.querySelector('.history-container h3');
    if (historyHeader) historyHeader.textContent = `Team: ${teamCode}`;

    listContainer.innerHTML = '<p style="color: #888; font-size: 0.9em;">Loading Team Goals...</p>';

    try {
        const response = await fetch(`${API_URL}/api/team-goals?team=${encodeURIComponent(teamCode)}`);
        if (!response.ok) throw new Error("Failed to load team goals");

        const goals = await response.json();
        renderGoals(listContainer, goals);

    } catch (error) {
        console.error("Team Load Error:", error);
        listContainer.innerHTML = `<p style="color:red">Error loading team history.</p>`;
    }
}

function renderGoals(container, goals) {
    if (!goals || goals.length === 0) {
        container.innerHTML = `<p>No history found...</p>`;
        return;
    }

    container.innerHTML = goals.map(goal => {
        // Color code the score
        const score = goal.clarityScore || 0;
        const scoreColor = (score >= 8) ? '#4CAF50' : (score >= 5) ? '#FFC107' : '#F44336';

        return `
        <div style="background: #fff; padding: 15px; margin-bottom: 10px; border-left: 5px solid ${scoreColor}; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <h4 style="margin:0 0 5px 0; font-size: 1em;">${goal.title}</h4>
            <p style="margin:0; font-size:0.9em; color:#555;">${goal.verdict}</p>
            <div style="margin-top:5px; font-size:0.8em; color:#888;">
                Score: <strong>${score}/10</strong> | Role: ${goal.role || 'N/A'}
            </div>
        </div>
        `;
    }).join('');
}


// --- SMART REFRESH BUTTON (USER vs TEAM) ---
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        if (!currentUser) return;

        // 1. Check if there is a Team Code in the box
        const teamInput = document.getElementById('teamInput');
        const teamCode = teamInput ? teamInput.value.trim() : null;

        // 2. Decision: Load Team or Personal?
        if (teamCode) {
            console.log("Refreshing Team View for:", teamCode);
            loadTeamGoals(teamCode); // Show the Leader View
        } else {
            console.log("Refreshing Personal View");
            loadUserGoals(currentUser.email); // Show Personal View
        }
    });
}


// --- 8. REPORT GENERATOR LOGIC ---
const reportBtn = document.getElementById('generateReportBtn');
const reportOutput = document.getElementById('report-output');

if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
        if (!currentUser) return alert("Please log in.");

        // Check if there is a Team Code entered
        const teamInput = document.getElementById('teamInput');
        const teamCode = teamInput ? teamInput.value.trim() : null;

        reportOutput.style.display = 'block';
        reportOutput.innerHTML = `<p style="color:#673AB7; font-weight:bold;">🧠 Analyzing data for ${teamCode ? 'Team ' + teamCode : 'your history'}...</p>`;

        try {
            const response = await fetch(`${API_URL}/api/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: currentUser.email,
                    teamId: teamCode // Send the team code if it exists!
                })
            });

            const data = await response.json();

            reportOutput.innerHTML = `
                <h3 style="margin-top:0; color:#673AB7; border-bottom: 2px solid #eee; padding-bottom:10px;">
                    📝 AI ${teamCode ? 'Team' : 'Personal'} Summary
                </h3>
                <div style="line-height: 1.6;">${data.report.replace(/\n/g, '<br>')}</div>
            `;

        } catch (error) {
            console.error(error);
            reportOutput.innerHTML = '<p style="color:red">Failed to generate report.</p>';
        }
    });
}