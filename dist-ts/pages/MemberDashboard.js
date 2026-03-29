"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const auth_1 = require("firebase/auth");
const firebase_1 = require("../api/firebase");
const config_1 = require("../api/config");
function MemberDashboard() {
    const [user, setUser] = (0, react_1.useState)(null);
    const [goals, setGoals] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        const unsubscribe = (0, auth_1.onAuthStateChanged)(firebase_1.auth, (currentUser) => {
            if (!currentUser) {
                navigate('/');
            }
            else {
                setUser(currentUser);
                fetchUserGoals(currentUser.email);
            }
        });
        return () => unsubscribe();
    }, [navigate]);
    async function fetchUserGoals(email) {
        try {
            const response = await fetch(`${config_1.API_URL}/api/goals?user=${email}`);
            if (!response.ok)
                throw new Error("Failed to load goals");
            const data = await response.json();
            setGoals(data);
        }
        catch (error) {
            console.error("User Load Error:", error);
        }
        finally {
            setLoading(false);
        }
    }
    ;
    const handleLogout = async () => {
        await (0, auth_1.signOut)(firebase_1.auth);
        navigate('/');
    };
    if (!user)
        return <div>Loading...</div>;
    return (<div className="container" style={{ maxWidth: '800px', margin: '40px auto' }}>
            <div id="auth-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5em' }}>Member Portal</h1>
                <button onClick={handleLogout} style={{ padding: '5px 10px', fontSize: '0.8em' }}>Logout</button>
            </div>

            <div id="active-mission-banner" className="highlight-box" style={{ display: 'none', border: '1px solid #C8E6C9', padding: '15px', borderRadius: '8px', marginBottom: '30px', background: '#E8F5E9' }}>
                <strong style={{ color: '#2E7D32' }}>🎯 Active Leader Goal:</strong>
                <span id="activeGoalText" style={{ display: 'block', marginTop: '5px', color: '#1B5E20' }}></span>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <react_router_dom_1.Link to="/member?mode=alignment" style={{ textDecoration: 'none', flex: 1 }}>
                    <div className="card-btn" style={{ textAlign: 'center', borderTop: '5px solid #00796b' }}>
                        <div style={{ fontSize: '3em', marginBottom: '10px' }}>🧠</div>
                        <h2 style={{ margin: 0, color: '#00796b' }}>Check Alignment</h2>
                        <p style={{ marginTop: '10px' }}>Do I understand the goal?</p>
                    </div>
                </react_router_dom_1.Link>

                <react_router_dom_1.Link to="/member?mode=progress" style={{ textDecoration: 'none', flex: 1 }}>
                    <div className="card-btn" style={{ textAlign: 'center', borderTop: '5px solid #e53935' }}>
                        <div style={{ fontSize: '3em', marginBottom: '10px' }}>📸</div>
                        <h2 style={{ margin: 0, color: '#e53935' }}>Proof of Progress</h2>
                        <p style={{ marginTop: '10px' }}>Upload screenshots & voice.</p>
                    </div>
                </react_router_dom_1.Link>
            </div>

            <div className="history-container" style={{ width: '100%', maxWidth: 'none', position: 'static', maxHeight: 'none' }}>
                <h3>Project Dashboard</h3>
                <div id="goals-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {loading ? (<p style={{ textAlign: 'center' }}>Loading history...</p>) : goals.length === 0 ? (<p style={{ textAlign: 'center' }}>No history found.</p>) : (goals.map((goal) => {
            const score = goal.clarityScore || 0;
            const scoreColor = (score >= 8) ? '#4CAF50' : (score >= 5) ? '#FFC107' : '#F44336';
            return (<div key={goal.id} className="history-item" style={{ borderLeft: `5px solid ${scoreColor}` }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1em' }}>{goal.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9em' }}>{goal.verdict}</p>
                                    <div style={{ marginTop: '5px', fontSize: '0.8em', opacity: 0.7 }}>
                                        Score: <strong>{score}/10</strong> | Role: {goal.role || 'N/A'}
                                    </div>
                                </div>);
        }))}
                </div>
            </div>
        </div>);
}
exports.default = MemberDashboard;
