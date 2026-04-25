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
    generatedLink,
    assessmentMode,
    setAssessmentMode,
    roleExpectations,
    setRoleExpectations
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

            {/* ASSESSMENT MODE SELECTOR */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#94a3b8',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '10px'
                }}>
                    ASSESSMENT MODE
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setAssessmentMode('goal-understanding')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: assessmentMode === 'goal-understanding'
                                ? '2px solid #4A90E2'
                                : '1px solid #E2E8F0',
                            backgroundColor: assessmentMode === 'goal-understanding'
                                ? '#EBF4FF'
                                : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            fontSize: '16px',
                            marginBottom: '4px'
                        }}>🎯</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: assessmentMode === 'goal-understanding' ? '#4A90E2' : '#2C3E50',
                            marginBottom: '2px'
                        }}>
                            Goal Understanding
                        </div>
                        <div style={{ fontSize: '11px', color: '#7F8C8D', lineHeight: '1.4' }}>
                            Do members understand what we are trying to achieve?
                        </div>
                    </button>

                    <button
                        onClick={() => setAssessmentMode('role-clarity')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: assessmentMode === 'role-clarity'
                                ? '2px solid #4A90E2'
                                : '1px solid #E2E8F0',
                            backgroundColor: assessmentMode === 'role-clarity'
                                ? '#EBF4FF'
                                : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>👤</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: assessmentMode === 'role-clarity' ? '#4A90E2' : '#2C3E50',
                            marginBottom: '2px'
                        }}>
                            Role Clarity
                        </div>
                        <div style={{ fontSize: '11px', color: '#7F8C8D', lineHeight: '1.4' }}>
                            Does each member know what THEY need to do?
                        </div>
                    </button>
                </div>
            </div>

            {/* ROLE EXPECTATIONS FIELD - only shows in role-clarity mode */}
            {assessmentMode === 'role-clarity' && (
                <div style={{ marginTop: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#94a3b8',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '6px'
                    }}>
                        ROLE-SPECIFIC EXPECTATIONS
                    </label>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', lineHeight: '1.5' }}>
                        Define what each role must deliver. This helps Clarity give precise, role-specific feedback.
                    </p>
                    <textarea
                        value={roleExpectations}
                        onChange={(e) => setRoleExpectations(e.target.value)}
                        placeholder={`Example:\nDesigner: Deliver mobile-first mockups by week 4\nEngineer: Build the API layer by week 6\nPM: Define success metrics and user stories by week 2`}
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            color: '#2C3E50'
                        }}
                    />
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        Optional but strongly recommended for accurate role-based scoring.
                    </p>
                </div>
            )}

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