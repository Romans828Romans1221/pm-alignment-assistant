import React, { useState } from 'react';

const LeaderPortal = () => {
    // State for the "AI Task Architect" Section
    const [archGoal, setArchGoal] = useState('');
    const [archRoles, setArchRoles] = useState('');

    // State for the "Define Mission" Section
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [teamCode, setTeamCode] = useState('');

    // System State
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [aiPlan, setAiPlan] = useState(null);

    // 1. Logic for "AI Task Architect" (Top Card)
    const handleArchitectGenerate = async () => {
        if (!archGoal) return alert("Please enter a project goal.");
        setLoading(true);
        // Simulate AI thinking for UI effect, then pre-fill the bottom form
        setTimeout(() => {
            setGoal(archGoal);
            setContext(`AI Suggested Roles: ${archRoles}. \n\nContext: We need to build this efficiently using modern tools.`);
            setTeamCode("Project-" + Math.floor(Math.random() * 1000));
            setLoading(false);
            alert("✨ AI has drafted your mission below. Review and Create Link!");
        }, 1500);
    };

    // 2. Logic for "Define Mission" & Link Generation (Bottom Card)
    const handleGenerateLink = async () => {
        if (!teamCode || !goal) {
            alert("Please enter a Team Code and a Goal.");
            return;
        }
        setLoading(true);

        try {
            const res = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectGoal: goal, teamRoles: context, teamCode: teamCode.trim() })
            });
            const data = await res.json();

            if (data.success) {
                setAiPlan(data.plan);
                // ✅ NEW LOGIC: Generate the correct link format
                const baseUrl = window.location.origin;
                setGeneratedLink(`${baseUrl}/member?code=${encodeURIComponent(teamCode.trim())}`);
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

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', color: 'white', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

            {/* LEFT COLUMN: Main Controls */}
            <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>🚀 Leader Control Center</h1>
                    <button style={{ background: '#333', border: '1px solid #555', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
                </div>

                {/* CARD 1: AI Task Architect */}
                <div style={{ background: '#18181b', padding: '25px', borderRadius: '16px', border: '1px solid #27272a', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '20px' }}>🤖</span>
                        <h3 style={{ margin: 0, color: '#a78bfa' }}>AI Task Architect</h3>
                    </div>
                    <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '20px' }}>Define a high-level goal, and Gemini will build your project plan.</p>

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>PROJECT GOAL</label>
                    <textarea
                        value={archGoal}
                        onChange={(e) => setArchGoal(e.target.value)}
                        placeholder="e.g. Build a Vibe Coding iOS App MVP..."
                        style={{ width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
                        rows="3"
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>AVAILABLE ROLES</label>
                    <input
                        value={archRoles}
                        onChange={(e) => setArchRoles(e.target.value)}
                        placeholder="e.g. Frontend Dev, Designer, QA"
                        style={{ width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '20px' }}
                    />

                    <button
                        onClick={handleArchitectGenerate}
                        style={{ width: '100%', background: '#7c3aed', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {loading ? "Thinking..." : "Generate Plan"}
                    </button>
                </div>

                {/* CARD 2: Define the Mission */}
                <div style={{ background: '#000', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    <h3 style={{ marginTop: 0 }}>1. Define the Mission</h3>

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px', marginTop: '15px' }}>TEAM CODE</label>
                    <input
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                        placeholder="e.g. Alpha-Squad"
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px', marginTop: '15px' }}>CORE GOAL / MEETING TOPIC</label>
                    <input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Launch v2 Website"
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px', marginTop: '15px' }}>DETAILED BREAKDOWN / CONTEXT</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Explain the details: timeline, key requirements, specific constraints..."
                        style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white' }}
                        rows="4"
                    />
                </div>

                {/* CARD 3: Invite Team (Restored!) */}
                <div style={{ background: '#111', padding: '25px', borderRadius: '16px', border: '1px solid #333', marginTop: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>2. Invite Team</h3>
                    <p style={{ color: '#888', fontSize: '0.9em' }}>Send this link to your team so they can check their alignment against your goal.</p>

                    <button
                        onClick={handleGenerateLink}
                        disabled={loading}
                        style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        🔗 {loading ? "Saving to Database..." : "Generate Member Link"}
                    </button>

                    {generatedLink && (
                        <div style={{ marginTop: '15px' }}>
                            <p style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#71717a' }}>Send to Team:</p>
                            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #059669', color: '#34d399', padding: '10px', borderRadius: '6px', fontSize: '0.9em', wordBreak: 'break-all' }}>
                                {generatedLink}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Dashboard (Visual Placeholder) */}
            <div style={{ flex: 1 }}>
                <div style={{ background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '20px' }}>📊</span>
                        <h3 style={{ margin: 0 }}>Team Dashboard</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button style={{ flex: 1, background: '#333', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8em', cursor: 'pointer' }}>🔄 Refresh</button>
                        <button style={{ flex: 1, background: '#7c3aed', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', fontSize: '0.8em', cursor: 'pointer' }}>✨ AI Report</button>
                    </div>

                    <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.9em', textAlign: 'center' }}>
                        Enter a Team Code on the left and click 'Generate Member Link' to see results.
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LeaderPortal;
