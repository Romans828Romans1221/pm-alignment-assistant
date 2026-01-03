import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [activeTab, setActiveTab] = useState('architecture');

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Header / Nav */}
            <header className="bg-white shadow-sm p-4 mb-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-indigo-600">Clarity PM Assistant</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('demo')}
                            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'demo' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Demo
                        </button>
                        <button
                            onClick={() => setActiveTab('architecture')}
                            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'architecture' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            System Architecture
                        </button>
                    </div>
                </div>
            </header>

            {/* TAB CONTENT */}
            <main className="max-w-5xl mx-auto p-4">

                {/* TAB 1: DEMO LINKS (Simple placeholder) */}
                {activeTab === 'demo' && (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold mb-4">Ready to align your team?</h2>
                        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                            Experience the power of real-time alignment checks using our AI-driven (or simulated) assistant.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/leader" className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 font-bold transition">
                                Launch Leader Portal
                            </Link>
                        </div>
                    </div>
                )}

                {/* TAB 2: SYSTEM ARCHITECTURE (User Content) */}
                {activeTab === 'architecture' && (
                    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">System Architecture</h2>

                        {/* 1. High-Level Description */}
                        <div className="bg-white shadow rounded-lg p-6 mb-8">
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Clarity PM Assistant is built on a modern, scalable full-stack architecture designed for real-time AI analysis. It separates concerns between a reactive frontend, a secure Node.js backend, and specialized cloud services for data persistence and generative intelligence.
                            </p>
                        </div>

                        {/* 2. The Diagram Image */}
                        <div className="bg-white shadow rounded-lg p-6 mb-8 flex justify-center">
                            {/* Diagram Image */}
                            <img
                                src="/architecture_diagram.png"
                                alt="Clarity PM Assistant Architecture Diagram"
                                className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                            {/* Fallback text if image isn't added yet */}
                            <p className="text-sm text-gray-500 italic mt-4 hidden">
                                (Diagram Placeholder: Generate the diagram image using the provided Mermaid code and place it in your public folder as /architecture_diagram.png)
                            </p>
                        </div>

                        {/* 3. Component Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h3 className="font-bold text-blue-900 text-xl mb-2">⚛️ Frontend (React)</h3>
                                <p className="text-blue-800">A responsive Single Page Application (SPA) built with React and Vite. It handles user interactions, displays real-time dashboards, and manages state for leader and member flows.</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <h3 className="font-bold text-green-900 text-xl mb-2">🟢 Backend (Node.js/Express)</h3>
                                <p className="text-green-800">A secure REST API server. It acts as the orchestrator, protecting API keys, validating data, and managing communication between the database and the AI service.</p>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                <h3 className="font-bold text-orange-900 text-xl mb-2">🔥 Database (Firebase Firestore)</h3>
                                <p className="text-orange-800">A NoSQL cloud database used for persisting project goals and storing historical alignment analysis results for dashboard reporting.</p>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <h3 className="font-bold text-purple-900 text-xl mb-2">🧠 AI Service (Google Gemini)</h3>
                                <p className="text-purple-800">Utilizes Google's Gemini 1.5 Pro model via the Generative AI SDK. The backend sends structured prompts to analyze semantic alignment between goals and understanding.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
