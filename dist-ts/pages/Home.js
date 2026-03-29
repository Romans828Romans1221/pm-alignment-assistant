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
const auth_1 = require("firebase/auth");
const firebase_1 = require("../api/firebase");
const Home_module_css_1 = __importDefault(require("./Home.module.css"));
const Home = () => {
    const [activeTab, setActiveTab] = (0, react_1.useState)('demo');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleLogin = async () => {
        try {
            setLoading(true);
            firebase_1.googleProvider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await (0, auth_1.signInWithPopup)(firebase_1.auth, firebase_1.googleProvider);
            if (result?.user) {
                navigate('/leader');
            }
        }
        catch (error) {
            console.error('Login Failed:', error.message);
            if (error.code === 'auth/popup-blocked') {
                alert('Please allow popups for this site in your browser settings, then try again.');
            }
            else {
                alert('Login Issue: ' + error.message);
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className={Home_module_css_1.default.container}>

      <div className={Home_module_css_1.default.nav}>
        <h1 className={Home_module_css_1.default.logo}>Clarity</h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('demo')} className={`${Home_module_css_1.default.navButton} ${activeTab === 'demo' ? Home_module_css_1.default.navButtonActive : ''}`}>
            Log In
          </button>
          <button onClick={() => setActiveTab('architecture')} className={`${Home_module_css_1.default.navButton} ${activeTab === 'architecture' ? Home_module_css_1.default.navButtonActive : ''}`}>
            Architecture
          </button>
        </div>
      </div>

      {activeTab === 'demo' && (<div className={Home_module_css_1.default.card}>
          <div className={Home_module_css_1.default.iconGlow}>✨</div>
          <h2 className={Home_module_css_1.default.titleGlow}>Sign in to Clarity</h2>
          <p className={Home_module_css_1.default.subtitle}>Align your team's goals in seconds.</p>

          <button onClick={handleLogin} className={Home_module_css_1.default.googleButton} disabled={loading}>
            <div className={Home_module_css_1.default.googleContent}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '20px', height: '20px' }}/>
              <span className={Home_module_css_1.default.buttonText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </div>
            <span className={Home_module_css_1.default.arrow}>→</span>
          </button>

          <div className={Home_module_css_1.default.footer}>
            <span>Create Account</span>
            <span>•</span>
            <span>Forgot Password?</span>
          </div>
        </div>)}

      {activeTab === 'architecture' && (<div className="max-w-4xl p-8 text-left">
          <h2 className={Home_module_css_1.default.titleGlow} style={{ fontSize: '2rem' }}>
            System Architecture
          </h2>
          <p className={Home_module_css_1.default.subtitle}>
            Secure Node.js Backend • React Frontend • Firebase Auth
          </p>
        </div>)}
    </div>);
};
exports.default = Home;
