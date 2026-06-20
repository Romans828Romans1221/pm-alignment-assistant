/* src/pages/LeaderPortal.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { API_URL } from '../api/config';

// 1. IMPORT THE NEW COMPONENT
import MissionControl from '../components/MissionControl';
import TeamPulse from '../components/TeamPulse';
import ProjectTab from '../components/ProjectTab';
import styles from './LeaderPortal.module.css';

const LeaderPortal = () => {
    const navigate = useNavigate();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [activeTab, setActiveTab] = useState('mission');
    const [meetingScore, setMeetingScore] = useState(null);
    const [meetingScoreLoading, setMeetingScoreLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

    // State Management
    const [teamCode, setTeamCode] = useState('');
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [assessmentMode, setAssessmentMode] = useState('goal-understanding');
    const [roleExpectations, setRoleExpectations] = useState('');
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


    useEffect(() => {
        if (!sessionId) return;
        const unsubscribe = refreshDashboard();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [sessionId]);

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
                assessmentMode,
                roleExpectations,
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

    const refreshDashboard = () => {
        if (!sessionId) return;
        setDashboardLoading(true);

        const currentQ = query(
            collection(db, "alignments"),
            where("sessionId", "==", sessionId)
        );

        const unsubscribe = onSnapshot(currentQ, async (snapshot) => {
            try {
                const currentResults = [];
                snapshot.forEach((doc) => currentResults.push(doc.data()));

                const memberNames = [...new Set(currentResults.map(r => r.name))];
                const historyMap = {};

                for (const memberName of memberNames) {
                    const historyQ = query(
                        collection(db, "alignments"),
                        where("name", "==", memberName)
                    );
                    const historySnap = await getDocs(historyQ);
                    const history = [];
                    historySnap.forEach((doc) => {
                        const data = doc.data();
                        history.push({
                            score: data.analysis?.score || 0,
                            submittedAt: data.submittedAt,
                            sessionId: data.sessionId
                        });
                    });
                    history.sort((a, b) =>
                        new Date(a.submittedAt) - new Date(b.submittedAt)
                    );
                    historyMap[memberName] = history;
                }

                const enrichedResults = currentResults.map(r => ({
                    ...r,
                    history: historyMap[r.name] || []
                }));

                setDashboardData(enrichedResults);
            } catch (err) {
                console.error(err);
            } finally {
                setDashboardLoading(false);
            }
        });

        return unsubscribe;
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

    const generateMeetingScore = async () => {
        if (dashboardData.length === 0) {
            return alert('No team submissions yet. Share the member link and wait for submissions first.');
        }
        setMeetingScoreLoading(true);
        try {
            const user = auth.currentUser;
            const token = await user.getIdToken();
            const res = await fetch(`${API_URL}/api/meeting-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    goal,
                    teamData: dashboardData.map(r => ({
                        name: r.name,
                        role: r.role,
                        score: r.analysis?.score || 0,
                        feedback: r.analysis?.feedback || '',
                        clarification: r.clarification || null
                    }))
                })
            });
            const data = await res.json();
            if (data.success) setMeetingScore(data.assessment);
            else alert('Could not generate meeting assessment. Try again.');
        } catch (err) {
            console.error(err);
            alert('Error generating meeting score: ' + err.message);
        } finally {
            setMeetingScoreLoading(false);
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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>
                    🚀 Leader Control Center
                </h1>
            </div>

            {/* THREE TAB NAVIGATION */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px',
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid #e2e8f0'
            }}>
                {[
                    { id: 'mission', label: '🎯 Mission', desc: 'Set goals and invite team' },
                    { id: 'project', label: '📋 Project', desc: 'Milestones and accountability' },
                    { id: 'analytics', label: '📊 Analytics', desc: 'Trends and intelligence' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: isMobile ? '10px 8px' : '12px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
                            color: activeTab === tab.id ? '#0f172a' : '#94a3b8',
                            fontWeight: activeTab === tab.id ? '700' : '500',
                            fontSize: isMobile ? '13px' : '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit',
                            boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MISSION TAB */}
            {activeTab === 'mission' && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    alignItems: 'flex-start'
                }}>
                    {/* LEFT COLUMN */}
                    <div style={{ width: '100%', maxWidth: '600px', flex: 1.5, minWidth: '300px' }}>
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
                            assessmentMode={assessmentMode}
                            setAssessmentMode={setAssessmentMode}
                            roleExpectations={roleExpectations}
                            setRoleExpectations={setRoleExpectations}
                        />

                        {/* MEETING PREVENTION SCORE */}
                        {dashboardData.length > 0 && (
                            <div style={{
                                marginTop: '16px',
                                padding: '20px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: meetingScore ? '16px' : '0'
                                }}>
                                    <div>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#0f172a'
                                        }}>
                                            🗓️ Do you need a meeting?
                                        </h4>
                                        <p style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: '#94a3b8'
                                        }}>
                                            AI analyzes your team's alignment to answer this
                                        </p>
                                    </div>
                                    <button
                                        onClick={generateMeetingScore}
                                        disabled={meetingScoreLoading}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: meetingScoreLoading ? '#94a3b8' : '#4A90E2',
                                            color: 'white',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: meetingScoreLoading ? 'not-allowed' : 'pointer',
                                            fontFamily: 'inherit',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {meetingScoreLoading ? '⏳ Analyzing...' : 'Assess Now'}
                                    </button>
                                </div>

                                {meetingScore && (
                                    <div>
                                        {/* Verdict */}
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            marginBottom: '12px',
                                            background: meetingScore.verdict === 'not_needed'
                                                ? '#f0fdf4'
                                                : meetingScore.verdict === 'partial'
                                                ? '#fefce8' : '#fef2f2',
                                            border: `1px solid ${
                                                meetingScore.verdict === 'not_needed'
                                                    ? '#86efac'
                                                    : meetingScore.verdict === 'partial'
                                                    ? '#fde047' : '#fca5a5'
                                            }`
                                        }}>
                                            <p style={{
                                                fontWeight: '700',
                                                fontSize: '15px',
                                                color: meetingScore.verdict === 'not_needed'
                                                    ? '#15803d'
                                                    : meetingScore.verdict === 'partial'
                                                    ? '#92400e' : '#dc2626',
                                                marginBottom: '4px',
                                                margin: '0 0 4px'
                                            }}>
                                                {meetingScore.verdict === 'not_needed'
                                                    ? '✅ Meeting not needed'
                                                    : meetingScore.verdict === 'partial'
                                                    ? '⚠️ Partial meeting recommended'
                                                    : '❌ Full meeting needed'}
                                            </p>
                                            <p style={{
                                                fontSize: '13px',
                                                color: '#475569',
                                                margin: 0
                                            }}>
                                                {meetingScore.summary}
                                            </p>
                                        </div>

                                        {/* Time saved */}
                                        {meetingScore.timeSavedMinutes > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 14px',
                                                background: '#f0f7ff',
                                                borderRadius: '8px',
                                                marginBottom: '12px',
                                                border: '1px solid #bfdbfe'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>⏱️</span>
                                                <div>
                                                    <p style={{
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        color: '#1e40af',
                                                        margin: 0
                                                    }}>
                                                        {meetingScore.timeSavedMinutes} minutes saved
                                                    </p>
                                                    <p style={{
                                                        fontSize: '11px',
                                                        color: '#3b82f6',
                                                        margin: 0
                                                    }}>
                                                        Across {dashboardData.length} team members
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Who needs attention */}
                                        {meetingScore.needsAttention?.length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <p style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '8px'
                                                }}>
                                                    Needs a conversation
                                                </p>
                                                {meetingScore.needsAttention.map((person, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 12px',
                                                        background: '#fef2f2',
                                                        borderRadius: '8px',
                                                        marginBottom: '6px',
                                                        border: '1px solid #fca5a5'
                                                    }}>
                                                        <div>
                                                            <span style={{
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                color: '#0f172a'
                                                            }}>
                                                                {person.name}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: '#94a3b8',
                                                                marginLeft: '6px'
                                                            }}>
                                                                {person.role}
                                                            </span>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '13px',
                                                            fontWeight: '700',
                                                            color: '#dc2626'
                                                        }}>
                                                            {person.score}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Suggested agenda */}
                                        {meetingScore.suggestedAgenda && (
                                            <div style={{
                                                padding: '12px',
                                                background: '#f8fafc',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <p style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#64748b',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    marginBottom: '8px'
                                                }}>
                                                    Suggested agenda
                                                </p>
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: '#1e293b',
                                                    lineHeight: '1.6',
                                                    margin: 0,
                                                    whiteSpace: 'pre-line'
                                                }}>
                                                    {meetingScore.suggestedAgenda}
                                                </p>
                                            </div>
                                        )}

                                        {/* Recommendation */}
                                        {meetingScore.recommendation && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px',
                                                background: '#f0f7ff',
                                                borderRadius: '8px',
                                                border: '1px solid #bfdbfe'
                                            }}>
                                                <p style={{
                                                    fontSize: '13px',
                                                    color: '#1e40af',
                                                    lineHeight: '1.6',
                                                    margin: 0
                                                }}>
                                                    💡 {meetingScore.recommendation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EMAIL INVITES */}
                        <div style={{
                            marginTop: '20px',
                            padding: '20px',
                            backgroundColor: '#F8FAFC',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#2C3E50', fontSize: '16px' }}>
                                📧 Invite Your Team
                            </h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#7F8C8D' }}>
                                Add your team members and send them a direct link to the alignment check.
                            </p>
                            {teamMembers.map((member, index) => (
                                <div key={index} style={{
                                    display: 'flex', gap: '8px',
                                    marginBottom: '8px', alignItems: 'center'
                                }}>
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
                                    color: '#4A90E2', padding: '8px 16px',
                                    borderRadius: '6px', cursor: 'pointer',
                                    fontSize: '13px', width: '100%', marginBottom: '12px'
                                }}
                            >
                                + Add another member
                            </button>
                            {inviteResult && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '6px',
                                    marginBottom: '12px',
                                    backgroundColor: inviteResult.success ? '#f0fdf4' : '#fef2f2',
                                    color: inviteResult.success ? '#15803d' : '#dc2626',
                                    fontSize: '14px',
                                    border: `1px solid ${inviteResult.success ? '#86efac' : '#fca5a5'}`
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
                                <p style={{
                                    margin: '8px 0 0', fontSize: '12px',
                                    color: '#94a3b8', textAlign: 'center'
                                }}>
                                    Generate a member link above first to enable invites
                                </p>
                            )}
                        </div>

                        {/* STRIPE UPGRADE */}
                        <div style={{
                            marginTop: '20px', padding: '15px',
                            backgroundColor: '#F0F4F8', borderRadius: '8px',
                            border: '1px solid #E2E8F0', textAlign: 'center'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50' }}>
                                Unlock Clarity Pro
                            </h4>
                            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#7F8C8D' }}>
                                Get unlimited alignment checks and advanced team insights.
                            </p>
                            <button
                                onClick={handleUpgrade}
                                disabled={isUpgrading || !sessionId}
                                style={{
                                    backgroundColor: '#4ade80',
                                    color: '#1e293b', border: 'none',
                                    padding: '12px 24px', borderRadius: '6px',
                                    fontWeight: 'bold',
                                    cursor: (isUpgrading || !sessionId) ? 'not-allowed' : 'pointer',
                                    width: '100%',
                                    opacity: (isUpgrading || !sessionId) ? 0.7 : 1
                                }}
                            >
                                {isUpgrading
                                    ? "🔄 Connecting to Secure Checkout..."
                                    : "💎 Upgrade to Pro ($49)"
                                }
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Team Pulse */}
                    <div style={{ width: '100%', maxWidth: '600px', flex: 1, minWidth: '280px' }}>
                        <TeamPulse
                            dashboardData={dashboardData}
                            dashboardLoading={dashboardLoading}
                            refreshDashboard={refreshDashboard}
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}

            {/* PROJECT TAB */}
            {activeTab === 'project' && (
                <ProjectTab
                    sessionId={sessionId}
                    goal={goal}
                    teamMembers={dashboardData}
                />
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div style={{ width: '100%' }}>
                    <TeamPulse
                        dashboardData={dashboardData}
                        dashboardLoading={dashboardLoading}
                        refreshDashboard={refreshDashboard}
                        isMobile={isMobile}
                    />
                </div>
            )}
        </div>
    );
};

export default LeaderPortal;