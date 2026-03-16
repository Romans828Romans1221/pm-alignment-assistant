import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../api/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import styles from './MemberAction.module.css'; // Importing the Coastal Styles

/* src/pages/MemberAction.jsx */
import { API_URL } from '../api/config';


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
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        // Ensure device ID for tracking
        if (!localStorage.getItem('clarity_device_id')) {
            localStorage.setItem('clarity_device_id', crypto.randomUUID());
        }
    }, []);

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
        if (!name || !role || !understanding) return alert("Please fill in all fields.");

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/analyze-alignment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: sessionId,
                    deviceId: localStorage.getItem('clarity_device_id'),
                    name, role, understanding,
                    goal: goalData.goal,
                    context: goalData.context
                })
            });

            // NEW: Intercept the Paywall Signal
            if (res.status === 402) {
                setShowPaywall(true);
                setLoading(false);
                return;
            }

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
            alert("Submission Issue: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- VISUALS (Coastal Theme) ---

    if (error) return (
        <div className={styles.errorContainer}>
            <h2>⚠️ {error}</h2>
            <p>Current Code: <strong>{sessionId}</strong></p>
        </div>
    );

    if (!goalData) return (
        <div className={styles.loadingContainer}>
            <h2>⏳ Loading Team Goal...</h2>
        </div>
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>✅ Team Alignment Check</h1>

            <div className={styles.goalCard}>
                <h4 className={styles.goalLabel}>TEAM GOAL</h4>
                <p className={styles.goalText}>{goalData.goal}</p>
                <div className={styles.contextDivider}>
                    <p className={styles.contextText}>{goalData.context}</p>
                </div>
            </div>

            <label className={styles.label}>YOUR NAME</label>
            <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
            />

            <label className={styles.label}>YOUR ROLE</label>
            <input
                className={styles.input}
                value={role} onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Designer"
            />

            <label className={styles.label}>YOUR UNDERSTANDING</label>
            <textarea
                className={styles.textarea}
                value={understanding} onChange={(e) => setUnderstanding(e.target.value)}
                rows="4"
                placeholder="What is the goal in your own words?"
            />

            <button
                className={styles.submitButton}
                onClick={handleAnalyze}
                disabled={loading || analysis}
            >
                {loading ? "🤖 Analyzing..." : "Submit Clarity Check"}
            </button>

            {analysis && (
                <div className={styles.analysisCard}>
                    <div className={styles.score} style={{ color: analysis.score > 80 ? '#4ade80' : '#facc15' }}>
                        {analysis.score}% Clear
                    </div>
                    <h3 className={styles.recommendation}>Recommendation: {analysis.meetingType}</h3>
                    <p className={styles.feedback}>"{analysis.feedback}"</p>
                </div>
            )}

            {/* --- MONETIZATION MODAL (Member View) --- */}
            {showPaywall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '40px', borderRadius: '16px',
                        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ color: '#4A90E2', marginTop: 0 }}>💎 Clarity Pro Required</h2>
                        <p style={{ color: '#7F8C8D', lineHeight: '1.6' }}>
                            This team has reached the <strong>30-check free limit</strong>.
                            Please ask your Team Leader to upgrade to Clarity Pro for unlimited checks!
                        </p>

                        <button
                            onClick={() => setShowPaywall(false)}
                            style={{
                                background: '#4A90E2', color: 'white', border: 'none',
                                padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold',
                                cursor: 'pointer', width: '100%', fontSize: '1.1rem', marginTop: '10px'
                            }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberAction;