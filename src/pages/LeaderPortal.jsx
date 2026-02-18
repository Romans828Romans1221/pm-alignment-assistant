/* src/pages/LeaderPortal.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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