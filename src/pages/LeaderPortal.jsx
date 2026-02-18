/* src/pages/LeaderPortal.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { auth, db } from '../api/firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// 1. IMPORT THE NEW COMPONENT
import MissionControl from '../components/MissionControl';

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

    if (checkingAuth) return <div style={{backgroundColor: '#000', height: '100vh'}}><h2 style={{color: 'white'}}>🚀 Initializing...</h2></div>;

    return (
        <div style={{ padding: isMobile ? '20px' : '40px', maxWidth: '1200px', margin: '0 auto', color: 'white', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px', alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>

            {/* LEFT COLUMN: Controls (Now Modularized) */}
            <div style={{ width: '100%', flex: 1.5 }}>
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
            </div>

            {/* RIGHT COLUMN: DASHBOARD (Still in-line for now) */}
            <div style={{ width: '100%', flex: 1 }}>
                <div style={{ background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #333', minHeight: isMobile ? 'auto' : '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>📊 Team Pulse</h3>
                        <button onClick={refreshDashboard} style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8em', cursor: 'pointer' }}>
                            {dashboardLoading ? "..." : "🔄 Refresh"}
                        </button>
                    </div>

                    {dashboardData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#555', padding: '40px 0' }}><p>No data yet.</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {dashboardData.map((result, index) => (
                                <div key={index} style={{ background: '#222', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #4ade80' }}>
                                    <strong>{result.name}</strong> - {result.analysis?.score}%
                                    <p style={{fontSize: '0.9em', color: '#ddd'}}>"{result.understanding}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderPortal;