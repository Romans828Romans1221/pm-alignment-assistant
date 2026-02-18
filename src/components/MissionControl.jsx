/* src/components/MissionControl.jsx */
import React from 'react';
import styles from './MissionControl.module.css'; //

const MissionControl = ({
    isMobile,
    teamCode,
    setTeamCode,
    goal,
    setGoal,
    context,
    setContext,
    handleGenerateLink,
    loading,
    handleSaveOnly,
    generatedLink
}) => {
    // Logic remains 100% identical to your original code
    return (
        <div className={styles.card} style={{ padding: isMobile ? '20px' : '25px' }}>
            <h3 className={styles.sectionTitle}>The Mission</h3>

            <label className={styles.label}>TEAM CODE (REQUIRED)</label>
            <input
                className={styles.input}
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="e.g. Squad-Alpha"
            />

            <label className={styles.label}>CORE GOAL</label>
            <input
                className={styles.input}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What are we building?"
            />

            <label className={styles.label}>DETAILED CONTEXT</label>
            <textarea
                className={styles.textarea}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add details: deadlines, specific tools, constraints..."
                rows="4"
            />

            <button
                className={styles.primaryButton}
                onClick={handleGenerateLink}
                disabled={loading}
            >
                🔗 {loading ? "Processing..." : "Generate Member Link"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button onClick={handleSaveOnly} className={styles.secondaryButton}>
                    Save mission without generating link
                </button>
            </div>

            {generatedLink && (
                <div className={styles.linkSuccess}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>✅ Link Copied!</strong>
                    {generatedLink}
                </div>
            )}
        </div>
    );
};

export default MissionControl;