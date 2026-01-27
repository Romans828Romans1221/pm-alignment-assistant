import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../api/firebase'; 
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';

const MemberAction = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('code')?.trim(); 

    const [goalData, setGoalData] = useState(null);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [understanding, setUnderstanding] = useState('');
    
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMission = async () => {
            if (sessionId) {
                try {
                    const docRef = doc(db, "missions", sessionId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setGoalData(docSnap.data()); 
                        setError(null);
                    } else {
                        setError("Mission not found. Check the link.");
                    }
                } catch (err) {
                    console.error(err);
                    setError("Connection failed.");
                }
            } else {
                setError("No Code found in the link.");
            }
        };
        fetchMission();
    }, [sessionId]);

    const handleAnalyze = async () => {
        if (!name || !role || !understanding) return alert("Please fill in all fields (Name, Role, Understanding).");

        setLoading(true);
        try {
            console.log("🚀 Sending to Server:", { teamCode: sessionId, name, role, understanding });

            // FIX: Using relative path and robust status check to prevent 'Error: 200'
            const res = await fetch('/api/analyze-alignment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: sessionId, 
                    name: name,   
                    role: role,
                    understanding: understanding,
                    goal: goalData.goal,
                    context: goalData.context
                })
            });

            // If we get a 200, we proceed to parse the JSON
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server Error (${res.status}): ${errorText}`);
            }

            const data = await res.json();

            if (data.success) {
                setAnalysis(data.analysis);
                
                await addDoc(collection(db, "alignments"), {
                    sessionId: sessionId,
                    name: name,
                    role: role,
                    understanding: understanding,
                    analysis: data.analysis,
                    submittedAt: new Date().toISOString()
                });
            } else {
                alert("Analysis error: " + (data.error || "Unknown"));
            }
        } catch (err) {
            console.error(err);
            // This alert is now only triggered for actual failures, not successful 200s
            alert("Submission Issue: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- VISUALS (100% Original Design) ---
    
    if (error) return (
        <div style={{ color: '#ef4444', padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', background: '#000', minHeight: '100vh' }}>
            <h2>⚠️ {error}</h2>
            <p>Current Code: <strong>{sessionId}</strong></p>
        </div>
    );

    if (!goalData) return (
        <div style={{ color: '#aaa', padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', background: '#000', minHeight: '100vh' }}>
            <h2>⏳ Loading Team Goal...</h2>
        </div>
    );

    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', color: 'white', fontFamily: 'sans-serif', background: '#000', minHeight: '100vh' }}>
            <h1>✅ Team Alignment Check</h1>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
                <h4 style={{ color: '#34d399', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '0.8em' }}>TEAM GOAL</h4>
                <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0 0 15px 0' }}>{goalData.goal}</p>
                <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.3)', paddingTop: '10px' }}>
                    <p style={{ color: '#a7f3d0', fontSize: '0.9em', margin: 0 }}>{goalData.context}</p>
                </div>
            </div>

            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.9em' }}>YOUR NAME</label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', marginBottom: '20px', borderRadius: '6px' }}
            />

            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.9em' }}>YOUR ROLE</label>
            <input
                value={role} onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Designer"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', marginBottom: '20px', borderRadius: '6px' }}
            />

            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.9em' }}>YOUR UNDERSTANDING</label>
            <textarea
                value={understanding} onChange={(e) => setUnderstanding(e.target.value)}
                rows="4"
                placeholder="What is the goal in your own words?"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#222', border: '1px solid #444', color: 'white', marginBottom: '20px', borderRadius: '6px' }}
            />

            <button
                onClick={handleAnalyze}
                disabled={loading || analysis}
                style={{ width: '100%', padding: '14px', background: '#10b981', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1em' }}
            >
                {loading ? "🤖 Analyzing..." : "Submit Clarity Check"}
            </button>

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