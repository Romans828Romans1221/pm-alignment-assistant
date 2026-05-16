import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../api/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
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
    const [isListening, setIsListening] = useState(false);
    const [clarification, setClarification] = useState('');
    const [clarificationSent, setClarificationSent] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!localStorage.getItem('clarity_device_id')) {
            localStorage.setItem('clarity_device_id', crypto.randomUUID());
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.onresult = (event) => {
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                }
                if (final) setUnderstanding(prev => prev + final);
            };
            recognitionRef.current.onend = () => setIsListening(false);
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
                    } else {
                        setError("Mission not found. Check the link.");
                    }
                } catch (err) {
                    setError("Connection failed.");
                }
            } else {
                setError("No code found in the link.");
            }
        };
        fetchMission();
    }, [sessionId]);

    const handleVoiceToggle = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleAnalyze = async () => {
        if (!name || !role || !understanding) return alert("Please fill in all fields.");
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
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
                    context: goalData.roleExpectations || goalData.context,
                    mode: goalData.assessmentMode || 'goal-understanding'
                })
            });

            if (res.status === 402) { setShowPaywall(true); setLoading(false); return; }
            if (!res.ok) { const t = await res.text(); throw new Error(`Server Error (${res.status}): ${t}`); }

            const data = await res.json();
            if (data.success) {
                setAnalysis(data.analysis);
                await addDoc(collection(db, "alignments"), {
                    sessionId, name, role, understanding,
                    analysis: data.analysis,
                    clarification: clarification.trim() || null,
                    submittedAt: new Date().toISOString()
                });
            }
        } catch (err) {
            alert("Submission Issue: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const isRoleClarity = goalData?.assessmentMode === 'role-clarity';
    const scoreColor = analysis?.score > 80 
        ? '#4ade80' : analysis?.score > 50 
        ? '#facc15' : '#f87171';

    if (error) return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0f',
            padding: '20px'
        }}>
            <div style={{ textAlign: 'center', color: '#f0f0f5' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h2 style={{ color: '#f0f0f5', marginBottom: '8px' }}>{error}</h2>
                <p style={{ color: '#94a3b8' }}>Code: {sessionId}</p>
            </div>
        </div>
    );

    if (!goalData) return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0f'
        }}>
            <div style={{ textAlign: 'center', color: '#f0f0f5' }}>
                <p style={{ color: '#94a3b8' }}>Loading your alignment check...</p>
            </div>
        </div>
    );

    return (
        <div style={{
            fontFamily: "'DM Sans', -apple-system, sans-serif",
            minHeight: '100vh'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .member-layout {
                    display: flex;
                    flex-direction: row;
                    min-height: 100vh;
                }

                /* LEFT PANEL */
                .member-left {
                    width: 42%;
                    min-height: 100vh;
                    background: linear-gradient(160deg, #0d1117 0%, #111827 50%, #0d1117 100%);
                    padding: 60px 48px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                /* RIGHT PANEL */
                .member-right {
                    flex: 1;
                    min-height: 100vh;
                    background-color: #f8fafc;
                    padding: 60px 48px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .member-right-inner {
                    max-width: 480px;
                    width: 100%;
                    margin: 0 auto;
                }

                /* INPUT STYLES */
                .input-field {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 15px;
                    font-family: inherit;
                    color: #1a1a2e;
                    background: white;
                    transition: all 0.2s ease;
                    outline: none;
                }
                .input-field:focus {
                    border-color: #4A90E2;
                    box-shadow: 0 0 0 3px rgba(74,144,226,0.12);
                }

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #4A90E2, #357ABD);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(74,144,226,0.4);
                }
                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .voice-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: none;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* ===================== */
                /* MOBILE STYLES        */
                /* ===================== */
                @media (max-width: 768px) {
                    .member-layout {
                        flex-direction: column;
                    }

                    .member-left {
                        width: 100%;
                        min-height: auto;
                        padding: 32px 24px;
                        justify-content: flex-start;
                    }

                    .member-left-logo {
                        margin-bottom: 24px !important;
                    }

                    .member-left-goal {
                        font-size: 24px !important;
                        margin-bottom: 16px !important;
                    }

                    .member-left-context {
                        font-size: 14px !important;
                    }

                    .member-left-footer {
                        display: none;
                    }

                    .member-right {
                        min-height: auto;
                        padding: 32px 24px;
                        justify-content: flex-start;
                        background-color: #f8fafc;
                    }

                    .member-right-inner {
                        max-width: 100%;
                    }

                    .input-field {
                        font-size: 16px;
                    }

                    .submit-btn {
                        font-size: 16px;
                        padding: 18px;
                    }
                }
            `}</style>

            <div className="member-layout">

                {/* LEFT PANEL — Context */}
                <div className="member-left">
                    {/* Background glow */}
                    <div style={{
                        position: 'absolute', top: '15%', left: '10%',
                        width: '300px', height: '300px',
                        background: 'radial-gradient(circle, rgba(74,144,226,0.12) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Logo */}
                        <div className="member-left-logo" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '48px'
                        }}>
                            <span style={{ fontSize: '20px' }}>✨</span>
                            <span style={{
                                fontFamily: 'DM Serif Display, serif',
                                fontSize: '20px',
                                color: '#f0f0f5'
                            }}>Clarity</span>
                        </div>

                        {/* Mode badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(74,144,226,0.15)',
                            border: '1px solid rgba(74,144,226,0.3)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            color: '#4A90E2',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginBottom: '24px'
                        }}>
                            {isRoleClarity ? '👤 Role Clarity Check' : '🎯 Goal Alignment Check'}
                        </div>

                        {/* Goal */}
                        <h1 className="member-left-goal" style={{
                            fontFamily: 'DM Serif Display, serif',
                            fontSize: 'clamp(24px, 3vw, 42px)',
                            color: '#f0f0f5',
                            lineHeight: '1.25',
                            marginBottom: '24px',
                            letterSpacing: '-0.5px'
                        }}>
                            {goalData.goal}
                        </h1>

                        {/* Context */}
                        {goalData.context && (
                            <p className="member-left-context" style={{
                                color: '#64748b',
                                fontSize: '15px',
                                lineHeight: '1.7',
                                borderTop: '1px solid #1e2d3d',
                                paddingTop: '20px'
                            }}>
                                {goalData.context}
                            </p>
                        )}

                        {/* Role clarity hint */}
                        {isRoleClarity && (
                            <div style={{
                                marginTop: '24px',
                                background: 'rgba(74,144,226,0.08)',
                                border: '1px solid rgba(74,144,226,0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <p style={{
                                    color: '#4A90E2',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Your focus
                                </p>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '14px',
                                    lineHeight: '1.6'
                                }}>
                                    Describe specifically what YOU need to deliver in your role to make this goal happen.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom tag — hidden on mobile via CSS */}
                    <div className="member-left-footer" style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: '40px'
                    }}>
                        <p style={{ color: '#1e2d3d', fontSize: '13px' }}>
                            tryclarityapp.live
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL — Action */}
                <div className="member-right">
                    <div className="member-right-inner">

                        {!analysis ? (
                            <>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#0f172a',
                                    marginBottom: '8px',
                                    fontFamily: 'DM Serif Display, serif'
                                }}>
                                    {isRoleClarity
                                        ? 'Define your role'
                                        : 'Share your understanding'
                                    }
                                </h2>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '15px',
                                    marginBottom: '28px',
                                    lineHeight: '1.6'
                                }}>
                                    {isRoleClarity
                                        ? 'Tell us what you personally need to deliver to make this goal a success.'
                                        : 'Explain the goal in your own words. Be specific and honest.'
                                    }
                                </p>

                                {/* Name */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        letterSpacing: '0.8px',
                                        textTransform: 'uppercase',
                                        marginBottom: '8px'
                                    }}>
                                        Your Name
                                    </label>
                                    <input
                                        className="input-field"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Sarah Chen"
                                    />
                                </div>

                                {/* Role */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        letterSpacing: '0.8px',
                                        textTransform: 'uppercase',
                                        marginBottom: '8px'
                                    }}>
                                        Your Role
                                    </label>
                                    <input
                                        className="input-field"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="e.g. Designer, Engineer, PM"
                                    />
                                </div>

                                {/* Understanding */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <label style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#64748b',
                                            letterSpacing: '0.8px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isRoleClarity
                                                ? `Your role as ${role || 'team member'}`
                                                : 'Your understanding'
                                            }
                                        </label>

                                        {recognitionRef.current && (
                                            <button
                                                className="voice-btn"
                                                onClick={handleVoiceToggle}
                                                style={{
                                                    backgroundColor: isListening
                                                        ? '#ef4444' : '#f1f5f9',
                                                    color: isListening
                                                        ? 'white' : '#64748b'
                                                }}
                                            >
                                                {isListening ? '⏹ Stop' : '🎙 Speak'}
                                            </button>
                                        )}
                                    </div>

                                    <textarea
                                        className="input-field"
                                        value={understanding}
                                        onChange={(e) => setUnderstanding(e.target.value)}
                                        rows={6}
                                        style={{ resize: 'vertical' }}
                                        placeholder={
                                            isRoleClarity
                                                ? `As a ${role || 'team member'}, I need to deliver... My key responsibilities are... My timeline is...`
                                                : "Explain the goal in your own words. What is the team trying to achieve and why does it matter?"
                                        }
                                    />
                                </div>

                                <button
                                    className="submit-btn"
                                    onClick={handleAnalyze}
                                    disabled={loading || !!analysis}
                                >
                                    {loading
                                        ? '🤖 Analyzing your response...'
                                        : 'Submit Clarity Check →'
                                    }
                                </button>
                            </>
                        ) : (
                            /* RESULTS */
                            <div style={{ animation: 'slideIn 0.5s ease' }}>
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '32px'
                                }}>
                                    <div style={{
                                        fontSize: '72px',
                                        fontWeight: '700',
                                        fontFamily: 'DM Serif Display, serif',
                                        color: scoreColor,
                                        lineHeight: '1',
                                        marginBottom: '8px'
                                    }}>
                                        {analysis.score}%
                                    </div>
                                    <div style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: scoreColor,
                                        marginBottom: '4px'
                                    }}>
                                        {analysis.score > 80
                                            ? 'Clear'
                                            : analysis.score > 50
                                            ? 'Needs Clarity'
                                            : 'Misaligned'
                                        }
                                    </div>
                                    <div style={{
                                        color: '#94a3b8',
                                        fontSize: '14px'
                                    }}>
                                        Alignment Score
                                    </div>
                                </div>

                                {analysis.meetingType !== 'None' && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: '#fefce8',
                                        border: '1px solid #fde047',
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                        marginBottom: '16px'
                                    }}>
                                        <span>💡</span>
                                        <span style={{
                                            fontSize: '14px',
                                            color: '#854d0e',
                                            fontWeight: '500'
                                        }}>
                                            Recommendation: {analysis.meetingType} suggested
                                        </span>
                                    </div>
                                )}

                                <div style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginBottom: '24px'
                                }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '10px'
                                    }}>
                                        AI Feedback
                                    </p>
                                    <p style={{
                                        color: '#1e293b',
                                        lineHeight: '1.7',
                                        fontSize: '15px'
                                    }}>
                                        {analysis.feedback}
                                    </p>
                                </div>

                                {/* CLARIFICATION QUESTION FIELD */}
                                {!clarificationSent ? (
                                    <div style={{
                                        background: '#f0f7ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        marginBottom: '16px'
                                    }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#1e40af',
                                            marginBottom: '6px'
                                        }}>
                                            💬 Have a question or need clarification?
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#3b82f6',
                                            marginBottom: '12px',
                                            lineHeight: '1.5'
                                        }}>
                                            Optional — your leader will see this alongside your score.
                                        </p>
                                        <textarea
                                            className="input-field"
                                            value={clarification}
                                            onChange={(e) => setClarification(e.target.value)}
                                            rows={3}
                                            placeholder="e.g. I am unclear about the timeline for my deliverables. Can we discuss before I start?"
                                            style={{
                                                resize: 'none',
                                                fontSize: '14px',
                                                marginBottom: '10px'
                                            }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!clarification.trim()) {
                                                    setClarificationSent(true);
                                                    return;
                                                }
                                                try {
                                                    const { addDoc, collection } = await import('firebase/firestore');
                                                    const { db } = await import('../api/firebase');
                                                    await addDoc(collection(db, "clarifications"), {
                                                        sessionId,
                                                        name,
                                                        role,
                                                        clarification: clarification.trim(),
                                                        submittedAt: new Date().toISOString(),
                                                        resolved: false
                                                    });
                                                    setClarificationSent(true);
                                                } catch (err) {
                                                    console.error(err);
                                                    setClarificationSent(true);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: clarification.trim()
                                                    ? 'linear-gradient(135deg, #4A90E2, #357ABD)'
                                                    : '#e2e8f0',
                                                color: clarification.trim() ? 'white' : '#94a3b8',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            {clarification.trim() ? '📤 Send Question to Leader' : 'Skip — No Questions'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '20px',
                                        background: '#f0fdf4',
                                        borderRadius: '12px',
                                        border: '1px solid #86efac',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                                        <p style={{
                                            color: '#15803d',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            marginBottom: '4px'
                                        }}>
                                            {clarification.trim()
                                                ? 'Question sent to your leader'
                                                : 'Response recorded'
                                            }
                                        </p>
                                        <p style={{
                                            color: '#64748b',
                                            fontSize: '13px'
                                        }}>
                                            Your leader will see your alignment score
                                            {clarification.trim() ? ' and your question' : ''} in their dashboard.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PAYWALL MODAL */}
            {showPaywall && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '20px',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px'
                        }}>💎</div>
                        <h2 style={{
                            color: '#0f172a',
                            marginBottom: '12px',
                            fontSize: '22px'
                        }}>
                            Clarity Pro Required
                        </h2>
                        <p style={{
                            color: '#64748b',
                            lineHeight: '1.6',
                            marginBottom: '24px'
                        }}>
                            This team has reached the free limit. Ask your Team Leader to upgrade to Clarity Pro.
                        </p>
                        <button
                            onClick={() => setShowPaywall(false)}
                            style={{
                                background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                                fontSize: '15px'
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