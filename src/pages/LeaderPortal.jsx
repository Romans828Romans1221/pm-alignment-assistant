/* src/pages/LeaderPortal.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { API_URL } from '../api/config';

// 1. IMPORT THE NEW COMPONENT
import MissionControl from '../components/MissionControl';
import TeamPulse from '../components/TeamPulse';
import styles from './LeaderPortal.module.css';

const LeaderPortal = () => {
    const navigate = useNavigate();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

    // State Management
    const [teamCode, setTeamCode] = useState('');
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [dashboardData, setDashboardData] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 850);
        window.addEventListener('resize', handleResize);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) navigate('/');
            else setCheckingAuth(false);
        });

        const uniqueId = crypto.randomUUID();
        setSessionId(uniqueId);

        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };
    }, [navigate]);

    // Detect Stripe Success Redirect
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isSuccess = urlParams.get('upgrade') === 'success';
        const codeInUrl = urlParams.get('code');
        if (isSuccess && codeInUrl) {
            const unlockPro = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/verify-upgrade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teamCode: codeInUrl })
                    });

                    if (res.ok) {
                        alert("🎉 Payment Successful! Clarity Pro is now unlocked for your team.");
                        // Clean up the URL so the alert doesn't keep firing on refresh
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (err) {
                    console.error("Upgrade verification failed:", err);
                }
            };
            unlockPro();
        }
    }, []);

    // Actions
    const handleGenerateLink = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await setDoc(doc(db, "missions", sessionId), {
                sessionId, teamName: teamCode, goal, context, createdAt: new Date().toISOString()
            });
            const link = `${window.location.origin}/member?code=${sessionId}`;
            await navigator.clipboard.writeText(link);
            setGeneratedLink(link);
            refreshDashboard();
        } catch (err) {
            alert("Database Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOnly = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await setDoc(doc(db, "missions", sessionId), {
                sessionId, teamName: teamCode, goal, context, createdAt: new Date().toISOString()
            });
            alert("Draft Saved Successfully");
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshDashboard = async () => {
        if (!sessionId) return;
        setDashboardLoading(true);
        try {
            let q = query(collection(db, "alignments"), where("sessionId", "==", sessionId));
            let querySnapshot = await getDocs(q);
            const results = [];
            querySnapshot.forEach((doc) => results.push(doc.data()));
            setDashboardData(results);
        } catch (err) {
            console.error(err);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!sessionId) return alert("Please generate a mission link first.");

        setIsUpgrading(true);
        try {
            const res = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode: sessionId })
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url; // Redirects the Leader to the secure Stripe page
            } else {
                alert(data.error || "Could not initialize checkout.");
            }
        } catch (err) {
            console.error("Checkout Error:", err);
            alert("Payment system error. Please try again.");
        } finally {
            setIsUpgrading(false);
        }
    };

    if (checkingAuth) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>🚀 Initializing...</h2></div>;

    return (
        <div className={styles.container}>

            {/* LEFT COLUMN: Controls (Now Modularized) */}
            <div style={{ width: '100%', maxWidth: '600px', flex: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>🚀 Leader Control Center</h1>
                </div>

                {/* THE NEW COMPONENT IN ACTION */}
                <MissionControl
                    isMobile={isMobile}
                    teamCode={teamCode}
                    setTeamCode={setTeamCode}
                    goal={goal}
                    setGoal={setGoal}
                    context={context}
                    setContext={setContext}
                    handleGenerateLink={handleGenerateLink}
                    loading={loading}
                    handleSaveOnly={handleSaveOnly}
                    generatedLink={generatedLink}
                />

                {/* --- STRIPE UPGRADE BUTTON --- */}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50' }}>Unlock Clarity Pro</h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#7F8C8D' }}>
                        Get unlimited alignment checks and advanced team insights for this mission.
                    </p>
                    <button
                        onClick={handleUpgrade}
                        disabled={isUpgrading || !sessionId}
                        style={{
                            backgroundColor: '#4ade80', // Coastal Green for positive action
                            color: '#1e293b',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: (isUpgrading || !sessionId) ? 'not-allowed' : 'pointer',
                            width: '100%',
                            opacity: (isUpgrading || !sessionId) ? 0.7 : 1
                        }}
                    >
                        {isUpgrading ? "🔄 Connecting to Secure Checkout..." : "💎 Upgrade to Pro ($49)"}
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: DASHBOARD (Now Modularized) */}
            <div style={{ width: '100%', maxWidth: '600px', flex: 1 }}>
                <TeamPulse
                    dashboardData={dashboardData}
                    dashboardLoading={dashboardLoading}
                    refreshDashboard={refreshDashboard}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
};

export default LeaderPortal;