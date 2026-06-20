import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const ProjectTab = ({ sessionId, goal, teamMembers }) => {
    const [milestones, setMilestones] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        name: '', description: '',
        assignedTo: '', assignedRole: '', dueDate: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionId) loadMilestones();
    }, [sessionId]);

    const loadMilestones = async () => {
        try {
            const q = query(
                collection(db, 'milestones'),
                where('sessionId', '==', sessionId)
            );
            const snap = await getDocs(q);
            const results = [];
            snap.forEach(d => results.push({ id: d.id, ...d.data() }));
            results.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            setMilestones(results);
        } catch (err) {
            console.error(err);
        }
    };

    const addMilestone = async () => {
        if (!newMilestone.name || !newMilestone.dueDate) {
            return alert('Please add a milestone name and due date.');
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'milestones'), {
                ...newMilestone,
                sessionId,
                projectId: sessionId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                preCheckScore: null,
                finalCheckScore: null,
                reworkRequired: false
            });
            setNewMilestone({
                name: '', description: '',
                assignedTo: '', assignedRole: '', dueDate: ''
            });
            setShowAddForm(false);
            loadMilestones();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (milestoneId, status) => {
        try {
            await updateDoc(doc(db, 'milestones', milestoneId), {
                status,
                completedAt: status === 'complete'
                    ? new Date().toISOString() : null
            });
            loadMilestones();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            complete: '#4ade80',
            'at-risk': '#f87171',
            'in-progress': '#4A90E2',
            pending: '#94a3b8'
        };
        return colors[status] || '#94a3b8';
    };

    const getStatusIcon = (status) => {
        const icons = {
            complete: '✅',
            'at-risk': '⚠️',
            'in-progress': '🔄',
            pending: '⏳'
        };
        return icons[status] || '⏳';
    };

    const getDaysUntil = (dueDate) => {
        if (!dueDate) return 'No due date';
        const days = Math.round(
            (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `Due in ${days} days`;
    };

    const completedCount = milestones.filter(m => m.status === 'complete').length;
    const atRiskCount = milestones.filter(m => m.status === 'at-risk').length;
    const inProgressCount = milestones.filter(m => m.status === 'in-progress').length;

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h3 style={{
                        margin: '0 0 4px',
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#0f172a'
                    }}>
                        📋 Project Milestones
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#94a3b8'
                    }}>
                        Track execution and hold your team accountable
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#4A90E2',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                    }}
                >
                    + Add Milestone
                </button>
            </div>

            {/* Goal context */}
            {goal && (
                <div style={{
                    padding: '12px 16px',
                    background: '#f0f7ff',
                    borderLeft: '4px solid #4A90E2',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#1e40af',
                    lineHeight: '1.5'
                }}>
                    <strong>Project Goal:</strong> {goal}
                </div>
            )}

            {/* Stats */}
            {milestones.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                    marginBottom: '20px'
                }}>
                    {[
                        { label: 'Total', value: milestones.length, color: '#64748b' },
                        { label: 'Complete', value: completedCount, color: '#4ade80' },
                        { label: 'In Progress', value: inProgressCount, color: '#4A90E2' },
                        { label: 'At Risk', value: atRiskCount, color: '#f87171' }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'white',
                            borderRadius: '10px',
                            padding: '12px',
                            textAlign: 'center',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                fontSize: '22px',
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
            )}

            {/* Add milestone form */}
            {showAddForm && (
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{
                        margin: '0 0 16px',
                        fontSize: '15px',
                        fontWeight: '700',
                        color: '#0f172a'
                    }}>
                        New Milestone
                    </h4>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <input
                            placeholder="Milestone name (e.g. Security architecture complete)"
                            value={newMilestone.name}
                            onChange={e => setNewMilestone({
                                ...newMilestone, name: e.target.value
                            })}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                        <textarea
                            placeholder="What needs to be delivered? Be specific."
                            value={newMilestone.description}
                            onChange={e => setNewMilestone({
                                ...newMilestone, description: e.target.value
                            })}
                            rows={2}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                placeholder="Assigned to (name)"
                                value={newMilestone.assignedTo}
                                onChange={e => setNewMilestone({
                                    ...newMilestone, assignedTo: e.target.value
                                })}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <input
                                placeholder="Their role"
                                value={newMilestone.assignedRole}
                                onChange={e => setNewMilestone({
                                    ...newMilestone, assignedRole: e.target.value
                                })}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <input
                                type="date"
                                value={newMilestone.dueDate}
                                onChange={e => setNewMilestone({
                                    ...newMilestone, dueDate: e.target.value
                                })}
                                style={{
                                    flex: 1,
                                    minWidth: '140px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={addMilestone}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: loading ? '#94a3b8' : '#4A90E2',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '14px'
                                }}
                            >
                                {loading ? 'Saving...' : 'Save Milestone'}
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Milestone list */}
            {milestones.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 24px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px dashed #e2e8f0'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
                    <p style={{
                        color: '#64748b',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '8px'
                    }}>
                        No milestones yet
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                        Add milestones to track execution and accountability
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#4A90E2',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                        }}
                    >
                        Add your first milestone
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {milestones.map((milestone) => (
                        <div key={milestone.id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            border: '1px solid #e2e8f0',
                            borderLeft: `4px solid ${getStatusColor(milestone.status)}`
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '6px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>
                                            {getStatusIcon(milestone.status)}
                                        </span>
                                        <span style={{
                                            fontWeight: '700',
                                            color: '#0f172a',
                                            fontSize: '15px'
                                        }}>
                                            {milestone.name}
                                        </span>
                                    </div>

                                    {milestone.description && (
                                        <p style={{
                                            fontSize: '13px',
                                            color: '#64748b',
                                            margin: '0 0 8px',
                                            lineHeight: '1.5'
                                        }}>
                                            {milestone.description}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        alignItems: 'center'
                                    }}>
                                        {milestone.assignedTo && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#4A90E2',
                                                fontWeight: '600'
                                            }}>
                                                👤 {milestone.assignedTo}
                                                {milestone.assignedRole &&
                                                    ` — ${milestone.assignedRole}`}
                                            </span>
                                        )}
                                        <span style={{
                                            fontSize: '12px',
                                            color: milestone.dueDate &&
                                                new Date(milestone.dueDate) < new Date() &&
                                                milestone.status !== 'complete'
                                                ? '#dc2626' : '#94a3b8',
                                            fontWeight: milestone.dueDate &&
                                                new Date(milestone.dueDate) < new Date() &&
                                                milestone.status !== 'complete'
                                                ? '600' : '400'
                                        }}>
                                            📅 {getDaysUntil(milestone.dueDate)}
                                        </span>
                                        {milestone.preCheckScore && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: milestone.preCheckScore > 70
                                                    ? '#15803d' : '#dc2626',
                                                fontWeight: '600'
                                            }}>
                                                🎯 {milestone.preCheckScore}% aligned
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status controls */}
                                <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}>
                                    {milestone.status !== 'complete' ? (
                                        <>
                                            <button
                                                onClick={() => updateStatus(
                                                    milestone.id, 'in-progress'
                                                )}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #bfdbfe',
                                                    background: milestone.status === 'in-progress'
                                                        ? '#dbeafe' : 'white',
                                                    color: '#1d4ed8',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                In Progress
                                            </button>
                                            <button
                                                onClick={() => updateStatus(
                                                    milestone.id, 'at-risk'
                                                )}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #fca5a5',
                                                    background: milestone.status === 'at-risk'
                                                        ? '#fee2e2' : 'white',
                                                    color: '#dc2626',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                At Risk
                                            </button>
                                            <button
                                                onClick={() => updateStatus(
                                                    milestone.id, 'complete'
                                                )}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #86efac',
                                                    background: 'white',
                                                    color: '#15803d',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                Complete ✓
                                            </button>
                                        </>
                                    ) : (
                                        <span style={{
                                            fontSize: '13px',
                                            color: '#15803d',
                                            fontWeight: '600',
                                            padding: '6px 12px',
                                            background: '#f0fdf4',
                                            borderRadius: '6px',
                                            border: '1px solid #86efac'
                                        }}>
                                            Completed ✅
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectTab;