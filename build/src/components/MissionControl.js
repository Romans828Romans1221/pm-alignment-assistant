"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* src/components/MissionControl.jsx */
const react_1 = __importDefault(require("react"));
const MissionControl_module_css_1 = __importDefault(require("./MissionControl.module.css")); //
const MissionControl = ({ isMobile, teamCode, setTeamCode, goal, setGoal, context, setContext, handleGenerateLink, loading, handleSaveOnly, generatedLink }) => {
    // Logic remains 100% identical to your original code
    return (<div className={MissionControl_module_css_1.default.card} style={{ padding: isMobile ? '20px' : '25px' }}>
            <h3 className={MissionControl_module_css_1.default.sectionTitle}>The Mission</h3>

            <label className={MissionControl_module_css_1.default.label}>TEAM CODE (REQUIRED)</label>
            <input className={MissionControl_module_css_1.default.input} value={teamCode} onChange={(e) => setTeamCode(e.target.value)} placeholder="e.g. Squad-Alpha"/>

            <label className={MissionControl_module_css_1.default.label}>CORE GOAL</label>
            <input className={MissionControl_module_css_1.default.input} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What are we building?"/>

            <label className={MissionControl_module_css_1.default.label}>DETAILED CONTEXT</label>
            <textarea className={MissionControl_module_css_1.default.textarea} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Add details: deadlines, specific tools, constraints..." rows="4"/>

            <button className={MissionControl_module_css_1.default.primaryButton} onClick={handleGenerateLink} disabled={loading}>
                🔗 {loading ? "Processing..." : "Generate Member Link"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button onClick={handleSaveOnly} className={MissionControl_module_css_1.default.secondaryButton}>
                    Save mission without generating link
                </button>
            </div>

            {generatedLink && (<div className={MissionControl_module_css_1.default.linkSuccess}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>✅ Link Copied!</strong>
                    {generatedLink}
                </div>)}
        </div>);
};
exports.default = MissionControl;
