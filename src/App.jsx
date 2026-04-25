import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import LeaderPortal from './pages/LeaderPortal';
import MemberDashboard from './pages/MemberDashboard';
import MemberAction from './pages/MemberAction';

function App() {
    return (
        <Router>
            <div className="app-container">
                <canvas id="bg-canvas"></canvas>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Home />} />
                    <Route path="/leader" element={<LeaderPortal />} />
                    <Route path="/member-dashboard" element={<MemberDashboard />} />
                    <Route path="/member" element={<MemberAction />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;