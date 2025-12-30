import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const MemberAction = () => {
    const [searchParams] = useSearchParams();
    // FIX 1: .trim() removes the accidental space (%20) from the URL
    const teamCode = searchParams.get('code')?.trim();

    const [goalData, setGoalData] = useState(null);
    const [error, setError] = useState(null); // New state for errors

    const [role, setRole] = useState('');
    const [understanding, setUnderstanding] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Goal on Load
    useEffect(() => {
        if (teamCode) {
            console.log("Fetching goal for:", teamCode);
            fetch(`/api/goals?code=${encodeURIComponent(teamCode)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setGoalData(data);
                        setError(null);
                    } else {
                        // FIX 2: If success is false, stop loading and show error
                        setError("Goal not found. Please check the Team Code.");
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError("Connection failed. Is the server running?");
                });
        } else {
            setError("No Team Code found in the link.");
        }
    }, [teamCode]);

    // 2. Analyze Alignment
    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/analyze-alignment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode, role, understanding })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysis(data.analysis);
            } else {
                alert("Analysis error: " + (data.error || "Unknown"));
            }
        } catch (err) {
            alert("Failed to connect.");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERING STATES ---

    // State A: Error
    if (error) return (
        <div style={{ color: '#ef4444', padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>⚠️ {error}</h2>
            <p>Current Code: <strong>{teamCode}</strong></p>
        </div>
    );

    // State B: Loading
    if (!goalData) return (
        <div style={{ color: '#aaa', padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>⏳ Loading Team Goal...</h2>
        </div>
    );

    // State C: Success (The App)
    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', color: 'white', fontFamily: 'sans-serif' }}>
            <h1>✅ Team Alignment Check</h1>

            {/* GOAL DISPLAY */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                <h4 style={{ color: '#34d399', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '0.8em' }}>TEAM GOAL ({teamCode})</h4>
                <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0 0 15px 0' }}>{goalData.goal}</p>
                <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.3)', paddingTop: '10px' }}>
                    <p style={{ color: '#a7f3d0', fontSize: '0.9em', margin: 0 }}>{goalData.context}</p>
                </div>
            </div>

            {/* INPUTS */}
            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.9em' }}>YOUR ROLE</label>
            <input
                value={role} onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', marginBottom: '20px', borderRadius: '6px' }}
            />

            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.9em' }}>YOUR UNDERSTANDING</label>
            <textarea
                value={understanding} onChange={(e) => setUnderstanding(e.target.value)}
                rows="4"
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', marginBottom: '20px', borderRadius: '6px' }}
            />

            <button
                onClick={handleAnalyze}
                disabled={loading || analysis}
                style={{ width: '100%', padding: '14px', background: '#10b981', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1em' }}
            >
                {loading ? "🤖 Analyzing..." : "Submit Clarity Check"}
            </button>

            {/* RESULTS */}
            {analysis && (
                <div style={{ marginTop: '30px', background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: analysis.score > 80 ? '#4ade80' : '#facc15', marginBottom: '10px' }}>
                        {analysis.score}% Clear
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Recommendation: {analysis.meetingType}</h3>
                    <p style={{ color: '#ccc', fontStyle: 'italic' }}>"{analysis.feedback}"</p>
                </div>
            )}
        </div>
    );
};

export default MemberAction;