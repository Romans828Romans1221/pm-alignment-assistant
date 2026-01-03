import React, { useState } from 'react';

const LeaderPortal = () => {
    // --- STATE MANAGEMENT ---
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [teamCode, setTeamCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    // Dashboard State
    const [dashboardData, setDashboardData] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // --- GENERATE LINK (SAVE TO DB) ---
    const handleGenerateLink = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);

        try {
            const res = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectGoal: goal, teamRoles: context, teamCode: teamCode.trim() })
            });
            const data = await res.json();

            if (data.success) {
                const baseUrl = window.location.origin;
                setGeneratedLink(`${baseUrl}/member?code=${encodeURIComponent(teamCode.trim())}`);
                refreshDashboard();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server.");
        } finally {
            setLoading(false);
        }
    };

    // --- DASHBOARD LOGIC ---
    const refreshDashboard = async () => {
        if (!teamCode) return alert("Enter a Team Code first!");
        setDashboardLoading(true);
        try {
            const res = await fetch(`/api/alignments?code=${encodeURIComponent(teamCode.trim())}`);
            const data = await res.json();
            if (data.success) {
                setDashboardData(data.results);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDashboardLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: 'white', display: 'flex', gap: '30px', alignItems: 'flex-start', fontFamily: 'Inter, sans-serif' }}>

            {/* LEFT COLUMN: Controls */}
            <div style={{ flex: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>🚀 Leader Control Center</h1>
                </div>

                {/* MISSION CONTROL */}
                <div style={{ background: '#000', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    {/* UPDATED TITLE HERE */}
                    <h3 style={{ marginTop: 0 }}>The Mission</h3>

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>TEAM CODE (REQUIRED)</label>
                    <input
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                        placeholder="e.g. Squad-Alpha"
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>CORE GOAL</label>
                    <input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="What are we building?"
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>DETAILED CONTEXT</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Add details: deadlines, specific tools, constraints..."
                        rows="4"
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '20px' }}
                    />

                    <button
                        onClick={handleGenerateLink}
                        disabled={loading}
                        style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        🔗 {loading ? "Saving..." : "Generate Member Link"}
                    </button>

                    {generatedLink && (
                        <div style={{ marginTop: '15px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', padding: '10px', borderRadius: '6px', color: '#34d399', fontSize: '0.8em', wordBreak: 'break-all' }}>
                            {generatedLink}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: REAL DASHBOARD */}
            <div style={{ flex: 1 }}>
                <div style={{ background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #333', minHeight: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>📊 Team Pulse</h3>
                        <button
                            onClick={refreshDashboard}
                            style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8em', cursor: 'pointer' }}
                        >
                            {dashboardLoading ? "..." : "🔄 Refresh"}
                        </button>
                    </div>

                    {dashboardData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#555', marginTop: '50px' }}>
                            <p>No data yet.</p>
                            <p style={{ fontSize: '0.8em' }}>Share the link and click Refresh!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {dashboardData.map((result, index) => (
                                <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${result.analysis.score > 80 ? '#4ade80' : '#facc15'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        {/* NAME AND ROLE DISPLAY FIX */}
                                        <div>
                                            <strong style={{ color: '#fff', display: 'block', fontSize: '1.1em' }}>
                                                {result.name || "Anonymous Member"}
                                            </strong>
                                            <span style={{ fontSize: '0.85em', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {result.role || "No Role"}
                                            </span>
                                        </div>
                                        <span style={{ color: result.analysis.score > 80 ? '#4ade80' : '#facc15', fontWeight: 'bold', fontSize: '1.2em' }}>
                                            {result.analysis.score}%
                                        </span>
                                    </div>

                                    <div style={{ background: '#18181b', padding: '10px', borderRadius: '6px', marginTop: '10px', border: '1px solid #333' }}>
                                        <p style={{ margin: 0, fontSize: '0.9em', color: '#ddd', fontStyle: 'italic' }}>"{result.understanding}"</p>
                                    </div>

                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333', fontSize: '0.8em', color: '#a78bfa', fontWeight: 'bold' }}>
                                        💡 Recommendation: {result.analysis.meetingType}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div >
    );
};

export default LeaderPortal;
