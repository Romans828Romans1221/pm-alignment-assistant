import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../api/firebase';
import { API_URL } from '../api/config';

function MemberDashboard() {
    const [user, setUser] = useState(null);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/');
            } else {
                setUser(currentUser);
                fetchUserGoals(currentUser.email);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchUserGoals = async (email) => {
        try {
            const response = await fetch(`${API_URL}/api/goals?user=${email}`);
            if (!response.ok) throw new Error("Failed to load goals");
            const data = await response.json();
            setGoals(data);
        } catch (error) {
            console.error("User Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '40px auto' }}>
            <div id="auth-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5em' }}>Member Portal</h1>
                <button onClick={handleLogout} style={{ padding: '5px 10px', fontSize: '0.8em' }}>Logout</button>
            </div>

            <div id="active-mission-banner" className="highlight-box" style={{ display: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
                <strong style={{ color: '#4CAF50' }}>🎯 Active Leader Goal:</strong>
                <span id="activeGoalText" style={{ display: 'block', marginTop: '5px', color: '#fff' }}></span>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <Link to="/member?mode=alignment" style={{ textDecoration: 'none', flex: 1 }}>
                    <div className="card-btn" style={{ textAlign: 'center', borderTop: '5px solid #00796b' }}>
                        <div style={{ fontSize: '3em', marginBottom: '10px' }}>🧠</div>
                        <h2 style={{ margin: 0, color: '#00796b' }}>Check Alignment</h2>
                        <p style={{ marginTop: '10px' }}>Do I understand the goal?</p>
                    </div>
                </Link>

                <Link to="/member?mode=progress" style={{ textDecoration: 'none', flex: 1 }}>
                    <div className="card-btn" style={{ textAlign: 'center', borderTop: '5px solid #e53935' }}>
                        <div style={{ fontSize: '3em', marginBottom: '10px' }}>📸</div>
                        <h2 style={{ margin: 0, color: '#e53935' }}>Proof of Progress</h2>
                        <p style={{ marginTop: '10px' }}>Upload screenshots & voice.</p>
                    </div>
                </Link>
            </div>

            <div className="history-container" style={{ width: '100%', maxWidth: 'none', position: 'static', maxHeight: 'none' }}>
                <h3>Project Dashboard</h3>
                <div id="goals-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center' }}>Loading history...</p>
                    ) : goals.length === 0 ? (
                        <p style={{ textAlign: 'center' }}>No history found.</p>
                    ) : (
                        goals.map((goal) => {
                            const score = goal.clarityScore || 0;
                            const scoreColor = (score >= 8) ? '#4CAF50' : (score >= 5) ? '#FFC107' : '#F44336';
                            return (
                                <div key={goal.id} className="history-item" style={{ borderLeft: `5px solid ${scoreColor}` }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1em' }}>{goal.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9em' }}>{goal.verdict}</p>
                                    <div style={{ marginTop: '5px', fontSize: '0.8em', opacity: 0.7 }}>
                                        Score: <strong>{score}/10</strong> | Role: {goal.role || 'N/A'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default MemberDashboard;
