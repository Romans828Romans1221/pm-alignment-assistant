import React, { useState } from 'react';
import { API_URL } from '../api/config';

const TaskPlanner = () => {
    const [goal, setGoal] = useState('');
    const [roles, setRoles] = useState('');
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPlan(null);

        try {
            const response = await fetch(`${API_URL}/api/generate-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectGoal: goal,
                    teamRoles: roles.split(',').map(r => r.trim())
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPlan(data.plan);
            } else {
                setError('AI failed to generate a valid plan. Try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ marginBottom: '30px', borderLeft: '5px solid #673ab7' }}>
            <h2 style={{ color: '#b39ddb', marginTop: 0 }}>🤖 AI Task Architect</h2>
            <p style={{ color: '#b0b0b0' }}>Define a high-level goal, and Gemini will build your project plan.</p>

            <form onSubmit={handleGenerate} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d1c4e9' }}>Project Goal</label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Build a Vibe Coding iOS App MVP..."
                        required
                        rows="3"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d1c4e9' }}>Available Roles</label>
                    <input
                        type="text"
                        value={roles}
                        onChange={(e) => setRoles(e.target.value)}
                        placeholder="e.g. Frontend Dev, Designer, QA"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="action-btn"
                    style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)' }}
                >
                    {loading ? '✨ Architecting...' : 'Generate Plan'}
                </button>
            </form>

            {/* ERROR MESSAGE */}
            {error && <p style={{ color: '#ff5252', marginTop: '10px' }}>{error}</p>}

            {/* RESULTS TABLE */}
            {plan && (
                <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#d1c4e9' }}>{plan.projectName}</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', color: '#e0e0e0' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>#</th>
                                <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Task</th>
                                <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Role</th>
                                <th style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plan.tasks.map((task, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>{task.step}</td>
                                    <td style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <strong style={{ color: '#fff' }}>{task.title}</strong>
                                        <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#b0b0b0' }}>{task.description}</p>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <span style={{ background: 'rgba(103, 58, 183, 0.2)', color: '#d1c4e9', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid rgba(103, 58, 183, 0.4)' }}>
                                            {task.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>{task.estimateHours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TaskPlanner;
