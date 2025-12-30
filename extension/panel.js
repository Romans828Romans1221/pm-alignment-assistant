// REPLACE THIS WITH YOUR ACTUAL DEPLOYED BACKEND URL
const API_URL = "https://clarity-pm-assistant-132738195526.us-central1.run.app";

document.getElementById('checkBtn').addEventListener('click', async () => {
    const topic = document.getElementById('topic').value;
    const context = document.getElementById('context').value;
    const btn = document.getElementById('checkBtn');
    const resultDiv = document.getElementById('result');

    if (!topic) return alert("Please enter a meeting topic.");

    // UI Loading State
    btn.textContent = "Analyzing...";
    btn.disabled = true;
    resultDiv.style.display = 'none';

    try {
        // We use the existing /clarity-check endpoint
        // We send a dummy 'understanding' since this simplified tool focuses on the Lead's context
        const response = await fetch(`${API_URL}/clarity-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: topic,
                context: context,
                understanding: "N/A (Quick Check)" // Dummy value to satisfy backend requirement
            })
        });

        if (!response.ok) throw new Error("Server Error");
        const data = await response.json();

        // Render Results
        const verdictDisplay = document.getElementById('verdictDisplay');
        const resultCard = document.getElementById('result');

        document.getElementById('scoreDisplay').textContent = `${data.clarity_score}/10`;
        verdictDisplay.textContent = data.verdict;

        // Color Coding
        if (data.clarity_score >= 8) {
            resultCard.style.borderLeftColor = "#f44336"; // Red (Unnecessary?)
            verdictDisplay.style.color = "#f44336";
        } else if (data.clarity_score <= 4) {
            resultCard.style.borderLeftColor = "#2e7d32"; // Green (Critical)
            verdictDisplay.style.color = "#2e7d32";
        } else {
            resultCard.style.borderLeftColor = "#ff9800"; // Orange
            verdictDisplay.style.color = "#ff9800";
        }

        // List Insights
        const list = document.getElementById('insightsList');
        list.innerHTML = data.gaps_insights.map(i => `<li>${i}</li>`).join('');

        resultDiv.style.display = 'block';

    } catch (error) {
        alert("Error connecting to AI. Check your internet or API URL.");
        console.error(error);
    } finally {
        btn.textContent = "Analyze Necessity";
        btn.disabled = false;
    }
});
