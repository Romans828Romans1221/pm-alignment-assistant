import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { auth, db } from '../api/firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const LeaderPortal = () => {
    const navigate = useNavigate();

    // --- NEW: AUTHENTICATION GATEKEEPER ---
    // This state ensures we don't show a blank page while Firebase is "shaking hands"
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // If no user is detected, safely redirect to the login page
                navigate('/');
            } else {
                // User is verified! Stop loading and show your dashboard
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // --- YOUR ORIGINAL STATE MANAGEMENT (Unchanged) ---
    const [teamCode, setTeamCode] = useState(''); 
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');

    const [sessionId, setSessionId] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    const [dashboardData, setDashboardData] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // --- ON LOAD: Generate Secure ID ---
    useEffect(() => {
        const uniqueId = crypto.randomUUID();
        setSessionId(uniqueId);
    }, []);

    // --- ACTION 1: SAVE & GENERATE LINK ---
    const handleGenerateLink = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);

        try {
            await setDoc(doc(db, "missions", sessionId), {
                sessionId: sessionId,
                teamName: teamCode,
                goal: goal,
                context: context,
                createdAt: new Date().toISOString()
            });

            const baseUrl = window.location.origin;
            const link = `${baseUrl}/member?code=${sessionId}`;

            await navigator.clipboard.writeText(link);
            setGeneratedLink(link);
            refreshDashboard();

        } catch (err) {
            console.error(err);
            alert("Database Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- ACTION 2: SAVE ONLY (No Link) ---
    const handleSaveOnly = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await setDoc(doc(db, "missions", sessionId), {
                sessionId, teamName: teamCode, goal, context, createdAt: new Date().toISOString()
            });
            alert("Draft Saved Successfully (No link generated)");
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- DASHBOARD: Fetch Data from Firestore ---
    const refreshDashboard = async () => {
        if (!sessionId) return;
        setDashboardLoading(true);
        try {
            let q = query(collection(db, "alignments"), where("sessionId", "==", sessionId));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty && teamCode) {
                q = query(collection(db, "alignments"), where("teamCode", "==", teamCode));
                querySnapshot = await getDocs(q);
            }

            const results = [];
            querySnapshot.forEach((doc) => {
                results.push(doc.data());
            });
            setDashboardData(results);
        } catch (err) {
            console.error("Dashboard Error:", err);
        } finally {
            setDashboardLoading(false);
        }
    };

    // --- NEW: PREVENT BLANK SCREEN DURING AUTH ---
    if (checkingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', backgroundColor: '#000', fontFamily: 'Inter, sans-serif' }}>
                <h2>🚀 Initializing Mission Control...</h2>
            </div>
        );
    }

    // --- YOUR ORIGINAL RETURN STATEMENT (Styling and UI preserved exactly) ---
    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: 'white', display: 'flex', gap: '30px', alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>

            {/* LEFT COLUMN: Controls */}
            <div style={{ flex: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>🚀 Leader Control Center</h1>
                </div>

                {/* MISSION CONTROL CARD */}
                <div style={{ background: '#000', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    <h3 style={{ marginTop: 0 }}>The Mission</h3>

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>TEAM CODE (REQUIRED)</label>
                    <input
                        value={teamCode}
                        onChange={(e) => setTeamCode(e.target.value)}
                        placeholder="e.g. Squad-Alpha"
                        style={{ width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>CORE GOAL</label>
                    <input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="What are we building?"
                        style={{ width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
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
                        style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.2s' }}
                    >
                        🔗 {loading ? "Processing..." : "Generate Member Link"}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <button
                            onClick={handleSaveOnly}
                            style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '0.85em', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                            Save mission without generating link
                        </button>
                    </div>

                    {generatedLink && (
                        <div style={{ marginTop: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', padding: '15px', borderRadius: '6px', color: '#34d399', fontSize: '0.9em', wordBreak: 'break-all' }}>
                            <strong style={{ display: 'block', marginBottom: '5px', color: '#10b981' }}>✅ Link Copied!</strong>
                            {generatedLink}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: DASHBOARD */}
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
                            {dashboardData.map((result, index) => {
                                const score = result.analysis?.score || result.score || 0;
                                const meeting = result.analysis?.meetingType || "Check-in";
                                const isHigh = score > 80;

                                return (
                                    <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${isHigh ? '#4ade80' : '#facc15'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <div>
                                                <strong style={{ color: '#fff', display: 'block', fontSize: '1.1em' }}>
                                                    {result.name || "Anonymous Member"}
                                                </strong>
                                                <span style={{ fontSize: '0.85em', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {result.role || "Member"}
                                                </span>
                                            </div>
                                            <span style={{ color: isHigh ? '#4ade80' : '#facc15', fontWeight: 'bold', fontSize: '1.2em' }}>
                                                {score}%
                                            </span>
                                        </div>
                                        <div style={{ background: '#18181b', padding: '10px', borderRadius: '6px', marginTop: '10px', border: '1px solid #333' }}>
                                            <p style={{ margin: 0, fontSize: '0.9em', color: '#ddd', fontStyle: 'italic' }}>"{result.understanding}"</p>
                                        </div>
                                        <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#a78bfa' }}>
                                            💡 Rec: {meeting}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderPortal;