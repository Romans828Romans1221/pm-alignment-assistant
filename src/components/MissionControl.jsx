/* src/components/MissionControl.jsx */
import React from 'react';

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
    return (
        <div style={{ background: '#000', padding: isMobile ? '20px' : '25px', borderRadius: '16px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>The Mission</h3>

            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>TEAM CODE (REQUIRED)</label>
            <input
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="e.g. Squad-Alpha"
                style={{ width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
            />

            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>CORE GOAL</label>
            <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What are we building?"
                style={{ width: '100%', boxSizing: 'border-box', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '15px' }}
            />

            <label style={{ display: 'block', fontSize: '0.8em', fontWeight: 'bold', color: '#71717a', marginBottom: '5px' }}>DETAILED CONTEXT</label>
            <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add details: deadlines, specific tools, constraints..."
                rows="4"
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: 'white', marginBottom: '20px' }}
            />

            <button
                onClick={handleGenerateLink}
                disabled={loading}
                style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
            >
                🔗 {loading ? "Processing..." : "Generate Member Link"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button onClick={handleSaveOnly} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '0.85em', textDecoration: 'underline', cursor: 'pointer' }}>
                    Save mission without generating link
                </button>
            </div>

            {generatedLink && (
                <div style={{ marginTop: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #059669', padding: '15px', borderRadius: '6px', color: '#34d399', fontSize: '0.9em', wordBreak: 'break-all' }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#10b981' }}>✅ Link Copied!</strong>
                    {generatedLink}
                </div>
            )}
        </div>
    );
};

export default MissionControl;