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

    // Email invite state
const [teamMembers, setTeamMembers] = useState([{ name: '', email: '' }]);
const [inviteSending, setInviteSending] = useState(false);
const [inviteResult, setInviteResult] = useState(null);

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

    //roster for team members
    useEffect(() => {
    const loadRoster = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${API_URL}/api/team-roster`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.members && data.members.length > 0) {
                setTeamMembers(data.members);
            }
        } catch (err) {
            console.log('No saved roster found');
        }
    };
    loadRoster();
}, []);


    // Actions
    const handleGenerateLink = async () => {
        if (!teamCode || !goal) return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await setDoc(doc(db, "missions", sessionId), {
                sessionId,
                teamName: teamCode,
                goal,
                context,
                createdAt: new Date().toISOString()
            });

            const link = `${window.location.origin}/member?code=${sessionId}`;
    setGeneratedLink(link);

    // Clipboard copy — gracefully fails on Safari iOS without blocking the flow
    try {
      await navigator.clipboard.writeText(link);
    } catch (clipboardErr) {
      console.warn('Clipboard copy not available on this device:', clipboardErr.message);
    }

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


    const handleSendInvites = async () => {
    if (!generatedLink) return alert('Please generate a member link first before sending invites.');
    if (!goal) return alert('Please set a team goal before sending invites.');

    const validMembers = teamMembers.filter(m => m.email && m.email.includes('@'));
    if (validMembers.length === 0) return alert('Please add at least one valid email address.');

    setInviteSending(true);
    setInviteResult(null);

    try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const res = await fetch(`${API_URL}/api/send-invites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                members: validMembers,
                teamGoal: goal,
                inviteLink: generatedLink,
                sessionId
            })
        });

        const data = await res.json();
        if (res.ok) {
            setInviteResult({ success: true, message: data.message });
        } else {
            setInviteResult({ success: false, message: data.error });
        }
    } catch (err) {
        setInviteResult({ success: false, message: 'Failed to send invites. Please try again.' });
    } finally {
        setInviteSending(false);
    }
};

const addMember = () => {
    if (teamMembers.length >= 20) return alert('Maximum 20 members per invite.');
    setTeamMembers([...teamMembers, { name: '', email: '' }]);
};

const removeMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
};

const updateMember = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
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

                {/* --- EMAIL INVITE SECTION --- */}
<div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
    <h4 style={{ margin: '0 0 6px 0', color: '#2C3E50', fontSize: '16px' }}>
        📧 Invite Your Team
    </h4>
    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#7F8C8D' }}>
        Add your team members and send them a direct link to the alignment check.
    </p>

    {teamMembers.map((member, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input
                type="text"
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateMember(index, 'name', e.target.value)}
                style={{
                    flex: 1, padding: '8px 12px', borderRadius: '6px',
                    border: '1px solid #E2E8F0', fontSize: '14px',
                    backgroundColor: 'white'
                }}
            />
            <input
                type="email"
                placeholder="Email address"
                value={member.email}
                onChange={(e) => updateMember(index, 'email', e.target.value)}
                style={{
                    flex: 2, padding: '8px 12px', borderRadius: '6px',
                    border: '1px solid #E2E8F0', fontSize: '14px',
                    backgroundColor: 'white'
                }}
            />
            {teamMembers.length > 1 && (
                <button
                    onClick={() => removeMember(index)}
                    style={{
                        background: 'none', border: 'none',
                        color: '#ef4444', cursor: 'pointer',
                        fontSize: '18px', padding: '4px'
                    }}
                >×</button>
            )}
        </div>
    ))}

    <button
        onClick={addMember}
        style={{
            background: 'none', border: '1px dashed #CBD5E0',
            color: '#4A90E2', padding: '8px 16px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '13px', width: '100%',
            marginBottom: '12px'
        }}
    >
        + Add another member
    </button>

    {inviteResult && (
        <div style={{
            padding: '10px 14px', borderRadius: '6px', marginBottom: '12px',
            backgroundColor: inviteResult.success ? '#f0fdf4' : '#fef2f2',
            color: inviteResult.success ? '#15803d' : '#dc2626',
            fontSize: '14px', border: `1px solid ${inviteResult.success ? '#86efac' : '#fca5a5'}`
        }}>
            {inviteResult.success ? '✅ ' : '❌ '}{inviteResult.message}
        </div>
    )}

    <button
        onClick={handleSendInvites}
        disabled={inviteSending || !generatedLink}
        style={{
            backgroundColor: generatedLink ? '#4A90E2' : '#94a3b8',
            color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '6px', fontWeight: 'bold',
            cursor: (inviteSending || !generatedLink) ? 'not-allowed' : 'pointer',
            width: '100%', fontSize: '14px'
        }}
    >
        {inviteSending ? '📤 Sending invites...' : '📧 Send Invites'}
    </button>

    {!generatedLink && (
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Generate a member link above first to enable invites
        </p>
    )}
</div>


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