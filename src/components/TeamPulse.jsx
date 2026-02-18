/* src/components/TeamPulse.jsx */
import React from 'react';
import styles from './TeamPulse.module.css'; //

const TeamPulse = ({ dashboardData, dashboardLoading, refreshDashboard, isMobile }) => {
    return (
        <div className={styles.dashboardCard} style={{ minHeight: isMobile ? 'auto' : '400px' }}>
            <div className={styles.header}>
                <h3 className={styles.title}>📊 Team Pulse</h3>
                <button onClick={refreshDashboard} className={styles.refreshButton}>
                    {dashboardLoading ? "..." : "🔄 Refresh"}
                </button>
            </div>

            {dashboardData.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No data yet.</p>
                    <p style={{ fontSize: '0.8em' }}>Share the link and click Refresh!</p>
                </div>
            ) : (
                <div className={styles.resultList}>
                    {dashboardData.map((result, index) => {
                        const score = result.analysis?.score || result.score || 0;
                        const meeting = result.analysis?.meetingType || "Check-in";
                        const isHigh = score > 80;

                        return (
                            <div
                                key={index}
                                className={styles.resultItem}
                                style={{ borderLeft: `4px solid ${isHigh ? '#4ade80' : '#facc15'}` }}
                            >
                                <div className={styles.nameRow}>
                                    <div>
                                        <span className={styles.nameText}>{result.name}</span>
                                        <span className={styles.roleText}>{result.role}</span>
                                    </div>
                                    <span
                                        className={styles.scoreText}
                                        style={{ color: isHigh ? '#2E7D32' : '#B8860B' }}
                                    >
                                        {score}%
                                    </span>
                                </div>
                                <div className={styles.understandingBox}>
                                    <p className={styles.understandingText}>"{result.understanding}"</p>
                                </div>
                                <div className={styles.recommendation}>💡 Rec: {meeting}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeamPulse;
