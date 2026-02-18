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

            const res = await fetch(`${API_URL}/api/analyze-alignment`, {
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
        </div>
    );
};

export default MemberAction;