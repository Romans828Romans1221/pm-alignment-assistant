"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* src/components/TeamPulse.jsx */
const react_1 = __importDefault(require("react"));
const TeamPulse_module_css_1 = __importDefault(require("./TeamPulse.module.css")); //
const TeamPulse = ({ dashboardData, dashboardLoading, refreshDashboard, isMobile }) => {
    return (<div className={TeamPulse_module_css_1.default.dashboardCard} style={{ minHeight: isMobile ? 'auto' : '400px' }}>
            <div className={TeamPulse_module_css_1.default.header}>
                <h3 className={TeamPulse_module_css_1.default.title}>📊 Team Pulse</h3>
                <button onClick={refreshDashboard} className={TeamPulse_module_css_1.default.refreshButton}>
                    {dashboardLoading ? "..." : "🔄 Refresh"}
                </button>
            </div>

            {dashboardData.length === 0 ? (<div className={TeamPulse_module_css_1.default.emptyState}>
                    <p>No data yet.</p>
                    <p style={{ fontSize: '0.8em' }}>Share the link and click Refresh!</p>
                </div>) : (<div className={TeamPulse_module_css_1.default.resultList}>
                    {dashboardData.map((result, index) => {
                const score = result.analysis?.score || result.score || 0;
                const meeting = result.analysis?.meetingType || "Check-in";
                const isHigh = score > 80;
                return (<div key={index} className={TeamPulse_module_css_1.default.resultItem} style={{ borderLeft: `4px solid ${isHigh ? '#4ade80' : '#facc15'}` }}>
                                <div className={TeamPulse_module_css_1.default.nameRow}>
                                    <div>
                                        <span className={TeamPulse_module_css_1.default.nameText}>{result.name}</span>
                                        <span className={TeamPulse_module_css_1.default.roleText}>{result.role}</span>
                                    </div>
                                    <span className={TeamPulse_module_css_1.default.scoreText} style={{ color: isHigh ? '#2E7D32' : '#B8860B' }}>
                                        {score}%
                                    </span>
                                </div>
                                <div className={TeamPulse_module_css_1.default.understandingBox}>
                                    <p className={TeamPulse_module_css_1.default.understandingText}>"{result.understanding}"</p>
                                </div>
                                <div className={TeamPulse_module_css_1.default.recommendation}>💡 Rec: {meeting}</div>
                            </div>);
            })}
                </div>)}
        </div>);
};
exports.default = TeamPulse;
