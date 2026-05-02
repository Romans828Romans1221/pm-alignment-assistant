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
                <button 
                    onClick={refreshDashboard} 
                    className={styles.refreshButton}
                    disabled={dashboardLoading}
                >
                    {dashboardLoading ? "..." : "🔄 Refresh"}
                </button>
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
                            {dashboardData.map((result, index) => {
                                const score = result.analysis?.score || 0;
                                const scoreColor = score > 80 
                                    ? '#4ade80' : score > 50 
                                    ? '#facc15' : '#f87171';
                                const hasHistory = result.history?.length > 1;

                                return (
                                    <div key={index} style={{
                                        background: 'white',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        marginBottom: '10px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
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

                                        {hasHistory ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}>
                                                <MiniChart history={result.history} />
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {result.history.map((h, i) => (
                                                        <div key={i}>
                                                            {new Date(h.submittedAt).toLocaleDateString()} — {h.score}%
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                background: '#f8fafc',
                                                borderRadius: '6px',
                                                padding: '8px',
                                                fontSize: '12px',
                                                color: '#94a3b8',
                                                textAlign: 'center'
                                            }}>
                                                Complete more checks to see trends
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