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
/* src/pages/LeaderPortal.jsx */
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const firebase_1 = require("../api/firebase");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const config_1 = require("../api/config");
// 1. IMPORT THE NEW COMPONENT
const MissionControl_1 = __importDefault(require("../components/MissionControl"));
const TeamPulse_1 = __importDefault(require("../components/TeamPulse"));
const LeaderPortal_module_css_1 = __importDefault(require("./LeaderPortal.module.css"));
const LeaderPortal = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [checkingAuth, setCheckingAuth] = (0, react_1.useState)(true);
    const [isMobile, setIsMobile] = (0, react_1.useState)(window.innerWidth < 850);
    // State Management
    const [teamCode, setTeamCode] = (0, react_1.useState)('');
    const [goal, setGoal] = (0, react_1.useState)('');
    const [context, setContext] = (0, react_1.useState)('');
    const [sessionId, setSessionId] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [generatedLink, setGeneratedLink] = (0, react_1.useState)('');
    const [dashboardData, setDashboardData] = (0, react_1.useState)([]);
    const [dashboardLoading, setDashboardLoading] = (0, react_1.useState)(false);
    const [isUpgrading, setIsUpgrading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 850);
        window.addEventListener('resize', handleResize);
        const unsubscribe = (0, auth_1.onAuthStateChanged)(firebase_1.auth, (user) => {
            if (!user)
                navigate('/');
            else
                setCheckingAuth(false);
        });
        const uniqueId = crypto.randomUUID();
        setSessionId(uniqueId);
        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };
    }, [navigate]);
    // Detect Stripe Success Redirect
    (0, react_1.useEffect)(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isSuccess = urlParams.get('upgrade') === 'success';
        const codeInUrl = urlParams.get('code');
        if (isSuccess && codeInUrl) {
            const unlockPro = async () => {
                try {
                    const res = await fetch(`${config_1.API_URL}/api/verify-upgrade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teamCode: codeInUrl })
                    });
                    if (res.ok) {
                        alert("🎉 Payment Successful! Clarity Pro is now unlocked for your team.");
                        // Clean up the URL so the alert doesn't keep firing on refresh
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
                catch (err) {
                    console.error("Upgrade verification failed:", err);
                }
            };
            unlockPro();
        }
    }, []);
    // Actions
    const handleGenerateLink = async () => {
        if (!teamCode || !goal)
            return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, "missions", sessionId), {
                sessionId,
                teamName: teamCode,
                goal,
                context,
                createdAt: new Date().toISOString()
            });
            const link = `${window.location.origin}/member?code=${sessionId}`;
            setGeneratedLink(link);
            // Clipboard copy — gracefully fails on Safari iOS without blocking the flow
            try {
                await navigator.clipboard.writeText(link);
            }
            catch (clipboardErr) {
                console.warn('Clipboard copy not available on this device:', clipboardErr.message);
            }
            refreshDashboard();
        }
        catch (err) {
            alert("Database Error: " + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveOnly = async () => {
        if (!teamCode || !goal)
            return alert("Please enter a Team Code and a Goal.");
        setLoading(true);
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, "missions", sessionId), {
                sessionId, teamName: teamCode, goal, context, createdAt: new Date().toISOString()
            });
            alert("Draft Saved Successfully");
        }
        catch (err) {
            alert("Error: " + err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const refreshDashboard = async () => {
        if (!sessionId)
            return;
        setDashboardLoading(true);
        try {
            let q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "alignments"), (0, firestore_1.where)("sessionId", "==", sessionId));
            let querySnapshot = await (0, firestore_1.getDocs)(q);
            const results = [];
            querySnapshot.forEach((doc) => results.push(doc.data()));
            setDashboardData(results);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setDashboardLoading(false);
        }
    };
    const handleUpgrade = async () => {
        if (!sessionId)
            return alert("Please generate a mission link first.");
        setIsUpgrading(true);
        try {
            const res = await fetch(`${config_1.API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode: sessionId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirects the Leader to the secure Stripe page
            }
            else {
                alert(data.error || "Could not initialize checkout.");
            }
        }
        catch (err) {
            console.error("Checkout Error:", err);
            alert("Payment system error. Please try again.");
        }
        finally {
            setIsUpgrading(false);
        }
    };
    if (checkingAuth)
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>🚀 Initializing...</h2></div>;
    return (<div className={LeaderPortal_module_css_1.default.container}>

            {/* LEFT COLUMN: Controls (Now Modularized) */}
            <div style={{ width: '100%', maxWidth: '600px', flex: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px' }}>🚀 Leader Control Center</h1>
                </div>

                {/* THE NEW COMPONENT IN ACTION */}
                <MissionControl_1.default isMobile={isMobile} teamCode={teamCode} setTeamCode={setTeamCode} goal={goal} setGoal={setGoal} context={context} setContext={setContext} handleGenerateLink={handleGenerateLink} loading={loading} handleSaveOnly={handleSaveOnly} generatedLink={generatedLink}/>

                {/* --- STRIPE UPGRADE BUTTON --- */}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50' }}>Unlock Clarity Pro</h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#7F8C8D' }}>
                        Get unlimited alignment checks and advanced team insights for this mission.
                    </p>
                    <button onClick={handleUpgrade} disabled={isUpgrading || !sessionId} style={{
            backgroundColor: '#4ade80', // Coastal Green for positive action
            color: '#1e293b',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: (isUpgrading || !sessionId) ? 'not-allowed' : 'pointer',
            width: '100%',
            opacity: (isUpgrading || !sessionId) ? 0.7 : 1
        }}>
                        {isUpgrading ? "🔄 Connecting to Secure Checkout..." : "💎 Upgrade to Pro ($49)"}
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: DASHBOARD (Now Modularized) */}
            <div style={{ width: '100%', maxWidth: '600px', flex: 1 }}>
                <TeamPulse_1.default dashboardData={dashboardData} dashboardLoading={dashboardLoading} refreshDashboard={refreshDashboard} isMobile={isMobile}/>
            </div>
        </div>);
};
exports.default = LeaderPortal;
