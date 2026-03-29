"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* src/App.jsx */
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
// These paths only work if App.jsx is in the src root!
const Home_1 = __importDefault(require("./pages/Home"));
const LeaderPortal_1 = __importDefault(require("./pages/LeaderPortal"));
const MemberDashboard_1 = __importDefault(require("./pages/MemberDashboard"));
const MemberAction_1 = __importDefault(require("./pages/MemberAction"));
function App() {
    return (<react_router_dom_1.BrowserRouter>
            <div className="app-container">
                <canvas id="bg-canvas"></canvas>
                <react_router_dom_1.Routes>
                    <react_router_dom_1.Route path="/" element={<Home_1.default />}/>
                    <react_router_dom_1.Route path="/leader" element={<LeaderPortal_1.default />}/>
                    <react_router_dom_1.Route path="/member-dashboard" element={<MemberDashboard_1.default />}/>
                    <react_router_dom_1.Route path="/member" element={<MemberAction_1.default />}/>
                </react_router_dom_1.Routes>
            </div>
        </react_router_dom_1.BrowserRouter>);
}
exports.default = App;
