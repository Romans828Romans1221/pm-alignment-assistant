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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const firebase_1 = require("../api/firebase");
const firestore_1 = require("firebase/firestore");
const MemberAction_module_css_1 = __importDefault(require("./MemberAction.module.css")); // Importing the Coastal Styles
/* src/pages/MemberAction.jsx */
const config_1 = require("../api/config");
const MemberAction = () => {
    const [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const sessionId = searchParams.get('code')?.trim();
    const [goalData, setGoalData] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [name, setName] = (0, react_1.useState)('');
    const [role, setRole] = (0, react_1.useState)('');
    const [understanding, setUnderstanding] = (0, react_1.useState)('');
    const [analysis, setAnalysis] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showPaywall, setShowPaywall] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        // Ensure device ID for tracking
        if (!localStorage.getItem('clarity_device_id')) {
            localStorage.setItem('clarity_device_id', crypto.randomUUID());
        }
    }, []);
    (0, react_1.useEffect)(() => {
        const fetchMission = async () => {
            if (sessionId) {
                try {
                    const docRef = (0, firestore_1.doc)(firebase_1.db, "missions", sessionId);
                    const docSnap = await (0, firestore_1.getDoc)(docRef);
                    if (docSnap.exists()) {
                        setGoalData(docSnap.data());
                        setError(null);
                    }
                    else {
                        setError("Mission not found. Check the link.");
                    }
                }
                catch (err) {
                    console.error(err);
                    setError("Connection failed.");
                }
            }
            else {
                setError("No Code found in the link.");
            }
        };
        fetchMission();
    }, [sessionId]);
    const handleAnalyze = async () => {
        if (!name || !role || !understanding)
            return alert("Please fill in all fields.");
        setLoading(true);
        try {
            const res = await fetch(`${config_1.API_URL}/api/analyze-alignment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamCode: sessionId,
                    deviceId: localStorage.getItem('clarity_device_id'),
                    name, role, understanding,
                    goal: goalData.goal,
                    context: goalData.context
                })
            });
            // NEW: Intercept the Paywall Signal
            if (res.status === 402) {
                setShowPaywall(true);
                setLoading(false);
                return;
            }
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server Error (${res.status}): ${errorText}`);
            }
            const data = await res.json();
            if (data.success) {
                setAnalysis(data.analysis);
                await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, "alignments"), {
                    sessionId: sessionId,
                    name: name,
                    role: role,
                    understanding: understanding,
                    analysis: data.analysis,
                    submittedAt: new Date().toISOString()
                });
            }
            else {
                alert("Analysis error: " + (data.error || "Unknown"));
            }
        }
        catch (err) {
            console.error(err);
            alert("Submission Issue: " + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    // --- VISUALS (Coastal Theme) ---
    if (error)
        return (<div className={MemberAction_module_css_1.default.errorContainer}>
            <h2>⚠️ {error}</h2>
            <p>Current Code: <strong>{sessionId}</strong></p>
        </div>);
    if (!goalData)
        return (<div className={MemberAction_module_css_1.default.loadingContainer}>
            <h2>⏳ Loading Team Goal...</h2>
        </div>);
    return (<div className={MemberAction_module_css_1.default.container}>
            <h1 className={MemberAction_module_css_1.default.heading}>✅ Team Alignment Check</h1>

            <div className={MemberAction_module_css_1.default.goalCard}>
                <h4 className={MemberAction_module_css_1.default.goalLabel}>TEAM GOAL</h4>
                <p className={MemberAction_module_css_1.default.goalText}>{goalData.goal}</p>
                <div className={MemberAction_module_css_1.default.contextDivider}>
                    <p className={MemberAction_module_css_1.default.contextText}>{goalData.context}</p>
                </div>
            </div>

            <label className={MemberAction_module_css_1.default.label}>YOUR NAME</label>
            <input className={MemberAction_module_css_1.default.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe"/>

            <label className={MemberAction_module_css_1.default.label}>YOUR ROLE</label>
            <input className={MemberAction_module_css_1.default.input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Designer"/>

            <label className={MemberAction_module_css_1.default.label}>YOUR UNDERSTANDING</label>
            <textarea className={MemberAction_module_css_1.default.textarea} value={understanding} onChange={(e) => setUnderstanding(e.target.value)} rows="4" placeholder="What is the goal in your own words?"/>

            <button className={MemberAction_module_css_1.default.submitButton} onClick={handleAnalyze} disabled={loading || analysis}>
                {loading ? "🤖 Analyzing..." : "Submit Clarity Check"}
            </button>

            {analysis && (<div className={MemberAction_module_css_1.default.analysisCard}>
                    <div className={MemberAction_module_css_1.default.score} style={{ color: analysis.score > 80 ? '#4ade80' : '#facc15' }}>
                        {analysis.score}% Clear
                    </div>
                    <h3 className={MemberAction_module_css_1.default.recommendation}>Recommendation: {analysis.meetingType}</h3>
                    <p className={MemberAction_module_css_1.default.feedback}>"{analysis.feedback}"</p>
                </div>)}

            {/* --- MONETIZATION MODAL (Member View) --- */}
            {showPaywall && (<div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(44, 62, 80, 0.9)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                    <div style={{
                background: 'white', padding: '40px', borderRadius: '16px',
                maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                        <h2 style={{ color: '#4A90E2', marginTop: 0 }}>💎 Clarity Pro Required</h2>
                        <p style={{ color: '#7F8C8D', lineHeight: '1.6' }}>
                            This team has reached the <strong>30-check free limit</strong>.
                            Please ask your Team Leader to upgrade to Clarity Pro for unlimited checks!
                        </p>

                        <button onClick={() => setShowPaywall(false)} style={{
                background: '#4A90E2', color: 'white', border: 'none',
                padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold',
                cursor: 'pointer', width: '100%', fontSize: '1.1rem', marginTop: '10px'
            }}>
                            Got it
                        </button>
                    </div>
                </div>)}
        </div>);
};
exports.default = MemberAction;
