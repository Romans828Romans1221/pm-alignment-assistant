import React, { useState } from 'react';
import styles from './TeamPulse.module.css';

const ScoreBar = ({ score }) => {
    const color = score > 80 ? '#4ade80' : score > 50 ? '#facc15' : '#f87171';
    return (
        <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#e2e8f0',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '6px'
        }}>
            <div style={{
                width: `${score}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '999px',
                transition: 'width 0.6s ease'
            }} />
        </div>
    );
};

const TrendIndicator = ({ history }) => {
    if (!history || history.length < 2) return null;
    
    const latest = history[history.length - 1].score;
    const previous = history[history.length - 2].score;
    const diff = latest - previous;
    
    if (diff > 0) return (
        <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600' }}>
            ↑ +{diff}%
        </span>
    );
    if (diff < 0) return (
        <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '600' }}>
            ↓ {diff}%
        </span>
    );
    return (
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>→ No change</span>
    );
};

const MiniChart = ({ history }) => {
    if (!history || history.length < 2) return null;

    const width = 120;
    const height = 40;
    const max = 100;
    const points = history.map((h, i) => {
        const x = (i / (history.length - 1)) * width;
        const y = height - (h.score / max) * height;
        return `${x},${y}`;
    }).join(' ');

    const lastScore = history[history.length - 1].score;
    const color = lastScore > 80 ? '#4ade80' : lastScore > 50 ? '#facc15' : '#f87171';

    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {history.map((h, i) => {
                const x = (i / (history.length - 1)) * width;
                const y = height - (h.score / max) * height;
                return (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={color}
                    />
                );
            })}
        </svg>
    );
};

const TeamPulse = ({ dashboardData, dashboardLoading, refreshDashboard, isMobile }) => {
    const [expandedMember, setExpandedMember] = useState(null);
    const [view, setView] = useState('current'); // 'current' or 'trends'

    const avgScore = dashboardData.length > 0
        ? Math.round(dashboardData.reduce((sum, r) => 
            sum + (r.analysis?.score || 0), 0) / dashboardData.length)
        : 0;

    const alignedCount = dashboardData.filter(r => 
        (r.analysis?.score || 0) > 80).length;

    const needsAttentionCount = dashboardData.filter(r => 
        (r.analysis?.score || 0) < 60).length;

    return (
        <div className={styles.dashboardCard} style={{ 
            minHeight: isMobile ? 'auto' : '400px',
            fontFamily: "'DM Sans', -apple-system, sans-serif"
        }}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>📊 Team Pulse</h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#4ade80',
                    fontWeight: '600'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#4ade80',
                        animation: 'pulse 2s infinite'
                    }} />
                    Live
                </div>
            </div>

            {dashboardData.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No data yet.</p>
                    <p style={{ fontSize: '0.8em' }}>Share the link and click Refresh!</p>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '16px'
                    }}>
                        {[
                            { 
                                label: 'Avg Score', 
                                value: `${avgScore}%`,
                                color: avgScore > 80 ? '#4ade80' : avgScore > 50 ? '#facc15' : '#f87171'
                            },
                            { 
                                label: 'Aligned', 
                                value: alignedCount,
                                color: '#4ade80'
                            },
                            { 
                                label: 'Needs Attention', 
                                value: needsAttentionCount,
                                color: needsAttentionCount > 0 ? '#f87171' : '#4ade80'
                            }
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: '#f8fafc',
                                borderRadius: '10px',
                                padding: '10px',
                                textAlign: 'center',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ 
                                    fontSize: '20px', 
                                    fontWeight: '700',
                                    color: stat.color
                                }}>
                                    {stat.value}
                                </div>
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: '#94a3b8',
                                    marginTop: '2px'
                                }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px'
                    }}>
                        {['current', 'trends'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: view === v ? '#4A90E2' : '#f1f5f9',
                                    color: view === v ? 'white' : '#64748b',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'inherit'
                                }}
                            >
                                {v === 'current' ? '📋 Current' : '📈 Trends'}
                            </button>
                        ))}
                    </div>

                    {/* Current View */}
                    {view === 'current' && (
                        <div className={styles.resultList}>
                            {dashboardData.map((result, index) => {
                                const score = result.analysis?.score || 0;
                                const meeting = result.analysis?.meetingType || "Check-in";
                                const scoreColor = score > 80 ? '#4ade80' : score > 50 ? '#facc15' : '#f87171';
                                const isExpanded = expandedMember === index;

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            borderLeft: `4px solid ${scoreColor}`,
                                            background: 'white',
                                            borderRadius: '10px',
                                            padding: '14px',
                                            marginBottom: '10px',
                                            border: `1px solid #e2e8f0`,
                                            borderLeft: `4px solid ${scoreColor}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setExpandedMember(
                                            isExpanded ? null : index
                                        )}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div>
                                                <div style={{ 
                                                    fontWeight: '600',
                                                    color: '#0f172a',
                                                    fontSize: '15px'
                                                }}>
                                                    {result.name}
                                                </div>
                                                <div style={{ 
                                                    color: '#94a3b8',
                                                    fontSize: '12px',
                                                    marginTop: '2px'
                                                }}>
                                                    {result.role}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '20px',
                                                    fontWeight: '700',
                                                    color: scoreColor
                                                }}>
                                                    {score}%
                                                </div>
                                                <TrendIndicator history={result.history} />
                                            </div>
                                        </div>

                                        <ScoreBar score={score} />

                                        {isExpanded && (
                                            <div style={{ marginTop: '12px' }}>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    borderRadius: '8px',
                                                    padding: '10px 12px',
                                                    marginBottom: '8px'
                                                }}>
                                                    <p style={{ 
                                                        fontSize: '13px',
                                                        color: '#475569',
                                                        lineHeight: '1.5',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        "{result.understanding}"
                                                    </p>
                                                </div>
                                                {result.analysis?.feedback && (
                                                    <div style={{
                                                        background: '#f0f7ff',
                                                        borderLeft: '3px solid #4A90E2',
                                                        borderRadius: '6px',
                                                        padding: '10px 12px',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <p style={{
                                                            fontSize: '12px',
                                                            color: '#2C3E50',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            🤖 {result.analysis.feedback}
                                                        </p>
                                                    </div>
                                                )}
                                                {result.clarification && (
                                                    <div style={{
                                                        background: '#fefce8',
                                                        border: '1px solid #fde047',
                                                        borderRadius: '8px',
                                                        padding: '10px 12px',
                                                        marginTop: '8px',
                                                        display: 'flex',
                                                        gap: '8px',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        <span style={{ fontSize: '14px', flexShrink: 0 }}>❓</span>
                                                        <div>
                                                            <p style={{
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                color: '#92400e',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                                marginBottom: '4px'
                                                            }}>
                                                                Member Question
                                                            </p>
                                                            <p style={{
                                                                fontSize: '13px',
                                                                color: '#78350f',
                                                                lineHeight: '1.5'
                                                            }}>
                                                                {result.clarification}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8'
                                                }}>
                                                    💡 Rec: {meeting}
                                                    {result.history?.length > 1 && (
                                                        <span style={{ marginLeft: '12px' }}>
                                                            📊 {result.history.length} total checks
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Trends View */}
                    {view === 'trends' && (
                        <div>
                            {/* TEAM-WIDE CONCEPT ANALYSIS */}
                            <div style={{
                                background: '#0f172a',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '16px',
                                border: '1px solid #1e293b'
                            }}>
                                <p style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#4A90E2',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '12px'
                                }}>
                                    🧠 Team Understanding Analysis
                                </p>

                                {/* What is understood well */}
                                <div style={{ marginBottom: '12px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4ade80',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        ✅ Consistently Understood
                                    </p>
                                    {dashboardData.length === 0 ? (
                                        <p style={{ fontSize: '12px', color: '#475569' }}>
                                            No data yet
                                        </p>
                                    ) : (() => {
                                        const highScoreMembers = dashboardData
                                            .filter(r => (r.analysis?.score || 0) > 70);
                                        
                                        if (highScoreMembers.length === 0) {
                                            return (
                                                <p style={{ 
                                                    fontSize: '12px', 
                                                    color: '#475569',
                                                    fontStyle: 'italic'
                                                }}>
                                                    No members above 70% yet
                                                </p>
                                            );
                                        }

                                        const understoodTopics = highScoreMembers
                                            .map(r => {
                                                const feedback = r.analysis?.feedback || '';
                                                const role = r.role || 'team member';
                                                if (feedback.toLowerCase().includes('timeline') || 
                                                    feedback.toLowerCase().includes('deadline')) {
                                                    return 'Project timelines and deadlines';
                                                }
                                                if (feedback.toLowerCase().includes('deliverable') ||
                                                    feedback.toLowerCase().includes('deliver')) {
                                                    return 'Role deliverables';
                                                }
                                                if (feedback.toLowerCase().includes('goal') ||
                                                    feedback.toLowerCase().includes('objective')) {
                                                    return 'Project goals and objectives';
                                                }
                                                if (feedback.toLowerCase().includes('team') ||
                                                    feedback.toLowerCase().includes('collaborat')) {
                                                    return 'Team collaboration requirements';
                                                }
                                                return `${role} responsibilities`;
                                            })
                                            .filter((v, i, a) => a.indexOf(v) === i)
                                            .slice(0, 3);

                                        return understoodTopics.map((topic, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '6px'
                                            }}>
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4ade80',
                                                    flexShrink: 0
                                                }} />
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {topic}
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Divider */}
                                <div style={{
                                    height: '1px',
                                    backgroundColor: '#1e293b',
                                    marginBottom: '12px'
                                }} />

                                {/* What is misunderstood */}
                                <div>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#f87171',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        ❌ Consistently Misunderstood
                                    </p>
                                    {dashboardData.length === 0 ? (
                                        <p style={{ fontSize: '12px', color: '#475569' }}>
                                            No data yet
                                        </p>
                                    ) : (() => {
                                        const lowScoreMembers = dashboardData
                                            .filter(r => (r.analysis?.score || 0) < 70);

                                        if (lowScoreMembers.length === 0) {
                                            return (
                                                <p style={{
                                                    fontSize: '12px',
                                                    color: '#475569',
                                                    fontStyle: 'italic'
                                                }}>
                                                    All members above 70% — great alignment!
                                                </p>
                                            );
                                        }

                                        const misunderstoodTopics = lowScoreMembers
                                            .map(r => {
                                                const feedback = r.analysis?.feedback || '';
                                                if (feedback.toLowerCase().includes('security') ||
                                                    feedback.toLowerCase().includes('vulnerabilit') ||
                                                    feedback.toLowerCase().includes('compliance')) {
                                                    return 'Security and compliance requirements';
                                                }
                                                if (feedback.toLowerCase().includes('architect') ||
                                                    feedback.toLowerCase().includes('technical') ||
                                                    feedback.toLowerCase().includes('infrastructure')) {
                                                    return 'Technical architecture constraints';
                                                }
                                                if (feedback.toLowerCase().includes('depend') ||
                                                    feedback.toLowerCase().includes('cross-team') ||
                                                    feedback.toLowerCase().includes('other team')) {
                                                    return 'Cross-team dependencies';
                                                }
                                                if (feedback.toLowerCase().includes('scope') ||
                                                    feedback.toLowerCase().includes('boundary') ||
                                                    feedback.toLowerCase().includes('limit')) {
                                                    return 'Project scope and boundaries';
                                                }
                                                if (feedback.toLowerCase().includes('business') ||
                                                    feedback.toLowerCase().includes('context') ||
                                                    feedback.toLowerCase().includes('why')) {
                                                    return 'Business context and rationale';
                                                }
                                                if (feedback.toLowerCase().includes('broad') ||
                                                    feedback.toLowerCase().includes('vague') ||
                                                    feedback.toLowerCase().includes('specific')) {
                                                    return 'Role-specific deliverables and specificity';
                                                }
                                                return 'Specific role responsibilities';
                                            })
                                            .filter((v, i, a) => a.indexOf(v) === i)
                                            .slice(0, 3);

                                        return (
                                            <>
                                                {misunderstoodTopics.map((topic, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '6px'
                                                    }}>
                                                        <div style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#f87171',
                                                            flexShrink: 0
                                                        }} />
                                                        <span style={{
                                                            fontSize: '12px',
                                                            color: '#94a3b8',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {topic}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div style={{
                                                    marginTop: '10px',
                                                    padding: '8px 10px',
                                                    background: 'rgba(248,113,113,0.08)',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(248,113,113,0.2)'
                                                }}>
                                                    <p style={{
                                                        fontSize: '11px',
                                                        color: '#f87171',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        💡 Recommended: Address these topics 
                                                        in your next meeting or add more context 
                                                        to your goal before the next check.
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* INDIVIDUAL MEMBER TRENDS */}
                            <p style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '10px'
                            }}>
                                Individual Understanding
                            </p>

                            {dashboardData.map((result, index) => {
                                const score = result.analysis?.score || 0;
                                const scoreColor = score > 80
                                    ? '#4ade80' : score > 50
                                    ? '#facc15' : '#f87171';
                                const hasHistory = result.history?.length > 1;
                                const feedback = result.analysis?.feedback || '';

                                // Extract what this individual understood and missed
                                const understood = [];
                                const missed = [];

                                if (feedback.toLowerCase().includes('correctly identified') ||
                                    feedback.toLowerCase().includes('strong') ||
                                    feedback.toLowerCase().includes('good understanding') ||
                                    feedback.toLowerCase().includes('well')) {
                                    const match = feedback.match(/([^.]*?(correctly|strong|good|well)[^.]*\.)/i);
                                    if (match) understood.push(match[0].trim());
                                }

                                if (feedback.toLowerCase().includes('however') ||
                                    feedback.toLowerCase().includes('but') ||
                                    feedback.toLowerCase().includes('missing') ||
                                    feedback.toLowerCase().includes('lacks') ||
                                    feedback.toLowerCase().includes('need to')) {
                                    const match = feedback.match(/([^.]*?(however|but|missing|lacks|need to)[^.]*\.)/i);
                                    if (match) missed.push(match[0].trim());
                                }

                                return (
                                    <div key={index} style={{
                                        background: 'white',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        marginBottom: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {/* Member header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontWeight: '600',
                                                    color: '#0f172a',
                                                    fontSize: '14px'
                                                }}>
                                                    {result.name}
                                                </div>
                                                <div style={{
                                                    color: '#94a3b8',
                                                    fontSize: '11px'
                                                }}>
                                                    {result.role} • {result.history?.length || 1} check{result.history?.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    color: scoreColor
                                                }}>
                                                    {score}%
                                                </div>
                                                <TrendIndicator history={result.history} />
                                            </div>
                                        </div>

                                        {/* Mini chart */}
                                        {hasHistory && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginBottom: '10px',
                                                padding: '8px',
                                                background: '#f8fafc',
                                                borderRadius: '8px'
                                            }}>
                                                <MiniChart history={result.history} />
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {result.history.map((h, i) => (
                                                        <div key={i}>
                                                            {h.submittedAt ? new Date(h.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'} — {h.score}%
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* What they understood */}
                                        {understood.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '6px',
                                                alignItems: 'flex-start',
                                                marginBottom: '6px',
                                                padding: '8px',
                                                background: 'rgba(74,222,128,0.06)',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(74,222,128,0.15)'
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    flexShrink: 0,
                                                    marginTop: '1px'
                                                }}>✅</span>
                                                <p style={{
                                                    fontSize: '12px',
                                                    color: '#166534',
                                                    lineHeight: '1.5',
                                                    margin: 0
                                                }}>
                                                    {understood[0]}
                                                </p>
                                            </div>
                                        )}

                                        {/* What they missed */}
                                        {missed.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '6px',
                                                alignItems: 'flex-start',
                                                padding: '8px',
                                                background: 'rgba(248,113,113,0.06)',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(248,113,113,0.15)'
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    flexShrink: 0,
                                                    marginTop: '1px'
                                                }}>⚠️</span>
                                                <p style={{
                                                    fontSize: '12px',
                                                    color: '#991b1b',
                                                    lineHeight: '1.5',
                                                    margin: 0
                                                }}>
                                                    {missed[0]}
                                                </p>
                                            </div>
                                        )}

                                        {/* No data state */}
                                        {!hasHistory && understood.length === 0 && missed.length === 0 && (
                                            <div style={{
                                                background: '#f8fafc',
                                                borderRadius: '6px',
                                                padding: '8px',
                                                fontSize: '12px',
                                                color: '#94a3b8',
                                                textAlign: 'center'
                                            }}>
                                                Complete more checks to see understanding patterns
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeamPulse;