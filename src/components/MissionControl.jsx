/* src/components/MissionControl.jsx */
import React, { useState, useRef, useEffect } from 'react';
import styles from './MissionControl.module.css';

const MissionControl = ({
    isMobile,
    teamCode,
    setTeamCode,
    goal,
    setGoal,
    context,
    setContext,
    handleGenerateLink,
    loading,
    handleSaveOnly,
    generatedLink,
    assessmentMode,
    setAssessmentMode,
    roleExpectations,
    setRoleExpectations
}) => {
    const [isListening, setIsListening] = useState(null);
    const [documentExtracting, setDocumentExtracting] = useState(false);
const [documentExtracted, setDocumentExtracted] = useState(false);
    const recognitionRef = useRef(null);
    const voiceSupported = typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

    useEffect(() => {
        if (!voiceSupported) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
    }, []);

    const toggleVoice = (field) => {
        if (!recognitionRef.current) return;

        if (isListening === field) {
            recognitionRef.current.stop();
            setIsListening(null);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        }

        recognitionRef.current.onresult = (event) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                }
            }
            if (final) {
                if (field === 'context') {
                    setContext(prev => prev + ' ' + final);
                } else if (field === 'roleExpectations') {
                    setRoleExpectations(prev => prev + ' ' + final);
                }
            }
        };

        recognitionRef.current.onend = () => setIsListening(null);
        recognitionRef.current.start();
        setIsListening(field);
    };


const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(fileType)) {
        alert('Please upload a PDF, Word document (.docx), or text file (.txt)');
        return;
    }

    setDocumentExtracting(true);
    setDocumentExtracted(false);

    try {
        let text = '';

        if (fileType === 'txt') {
            text = await file.text();
        } else if (fileType === 'docx') {
            const mammoth = await import('mammoth');
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else if (fileType === 'pdf') {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ') + '\n';
            }
            text = fullText;
        }

        if (text.trim().length < 50) {
            throw new Error('Document appears to be empty or unreadable.');
        }

        const { API_URL } = await import('../api/config');
        const res = await fetch(`${API_URL}/api/extract-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentText: text,
                fileName: file.name
            })
        });

        const data = await res.json();

        if (data.success) {
            if (data.extracted.goal) setGoal(data.extracted.goal);
            if (data.extracted.context) setContext(data.extracted.context);
            if (data.extracted.roleExpectations) {
                setRoleExpectations(data.extracted.roleExpectations);
                setAssessmentMode('role-clarity');
            }
            setDocumentExtracted(true);
        } else {
            throw new Error(data.error || 'Extraction failed');
        }

    } catch (error) {
        alert('Could not extract content: ' + error.message + 
              '\nYou can still enter the details manually below.');
        setDocumentExtracted(false);
    } finally {
        setDocumentExtracting(false);
    }
};
    const VoiceButton = ({ field }) => {
        if (!voiceSupported) return null;
        const active = isListening === field;
        return (
            <button
                onClick={() => toggleVoice(field)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: active ? '#ef4444' : '#f1f5f9',
                    color: active ? 'white' : '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    animation: active ? 'pulse 1.5s infinite' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                {active ? '⏹ Stop' : '🎙 Speak'}
            </button>
        );
    };

    return (
        <div className={styles.card} style={{ padding: isMobile ? '20px' : '25px' }}>
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
                    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
                }
            `}</style>

            <h3 className={styles.sectionTitle}>The Mission</h3>


            {/* TEAM CODE */}
            <label className={styles.label}>TEAM CODE (REQUIRED)</label>
            <input
                className={styles.input}
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="e.g. Squad-Alpha"
            />

            {/* CORE GOAL */}
            <label className={styles.label}>CORE GOAL</label>
            <input
                className={styles.input}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What are we building?"
            />

            {/* DETAILED CONTEXT with voice */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
                marginTop: '16px'
            }}>
                <label className={styles.label} style={{ margin: 0 }}>
                    DETAILED CONTEXT
                </label>
                <VoiceButton field="context" />
            </div>
            {isListening === 'context' && (
                <div style={{
                    fontSize: '12px',
                    color: '#ef4444',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        display: 'inline-block',
                        animation: 'pulse 1s infinite'
                    }} />
                    Listening... speak your context details
                </div>
            )}
            <textarea
                className={styles.textarea}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add details: deadlines, specific tools, constraints... or tap Speak above"
                rows="4"
            />

            {/* DOCUMENT UPLOAD SECTION */}
            <div style={{
                marginBottom: '16px',
                marginTop: '8px'
            }}>
                {!documentExtracting && !documentExtracted && (
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px dashed #93c5fd',
                        backgroundColor: '#f8fbff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '12px',
                        color: '#3b82f6',
                        fontWeight: '500'
                    }}>
                        <span>📄</span>
                        <span>Import from document — PDF, Word, or text</span>
                        <span style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            color: '#93c5fd'
                        }}>
                            Auto-fills goal and context
                        </span>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            style={{ display: 'none' }}
                            onChange={handleDocumentUpload}
                        />
                    </label>
                )}

                {documentExtracting && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: '#f0f7ff',
                        border: '1px solid #bfdbfe',
                        fontSize: '13px',
                        color: '#3b82f6'
                    }}>
                        <span>🤖</span>
                        <span style={{ fontWeight: '600' }}>
                            Reading document...
                        </span>
                        <span style={{ fontSize: '12px', color: '#60a5fa' }}>
                            Gemini is extracting your goal and context
                        </span>
                    </div>
                )}

                {documentExtracted && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #86efac'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            color: '#15803d',
                            fontWeight: '600'
                        }}>
                            <span>✅</span>
                            <span>Document imported — fields populated</span>
                        </div>
                        <button
                            onClick={() => {
                                setDocumentExtracted(false);
                                setDocumentExtracting(false);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#15803d',
                                cursor: 'pointer',
                                fontSize: '12px',
                                textDecoration: 'underline',
                                fontFamily: 'inherit'
                            }}
                        >
                            Upload different file
                        </button>
                    </div>
                )}
            </div>

            {/* ASSESSMENT MODE SELECTOR */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#94a3b8',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '10px'
                }}>
                    ASSESSMENT MODE
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setAssessmentMode('goal-understanding')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: assessmentMode === 'goal-understanding'
                                ? '2px solid #4A90E2'
                                : '1px solid #E2E8F0',
                            backgroundColor: assessmentMode === 'goal-understanding'
                                ? '#EBF4FF'
                                : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>🎯</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: assessmentMode === 'goal-understanding'
                                ? '#4A90E2' : '#2C3E50',
                            marginBottom: '2px'
                        }}>
                            Goal Understanding
                        </div>
                        <div style={{ fontSize: '11px', color: '#7F8C8D', lineHeight: '1.4' }}>
                            Do members understand what we are trying to achieve?
                        </div>
                    </button>

                    <button
                        onClick={() => setAssessmentMode('role-clarity')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: assessmentMode === 'role-clarity'
                                ? '2px solid #4A90E2'
                                : '1px solid #E2E8F0',
                            backgroundColor: assessmentMode === 'role-clarity'
                                ? '#EBF4FF'
                                : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>👤</div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: assessmentMode === 'role-clarity'
                                ? '#4A90E2' : '#2C3E50',
                            marginBottom: '2px'
                        }}>
                            Role Clarity
                        </div>
                        <div style={{ fontSize: '11px', color: '#7F8C8D', lineHeight: '1.4' }}>
                            Does each member know what THEY need to do?
                        </div>
                    </button>
                </div>
            </div>

            {/* ROLE EXPECTATIONS - optional, no friction */}
            {assessmentMode === 'role-clarity' && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                    }}>
                        <label style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#64748b',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>
                            ROLE-SPECIFIC EXPECTATIONS
                        </label>
                        <VoiceButton field="roleExpectations" />
                    </div>

                    <p style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginBottom: '8px',
                        lineHeight: '1.5'
                    }}>
                        Optional but strongly recommended. The more specific you are
                        here the more precise the AI feedback will be for each member.
                        Tap Speak to dictate your expectations hands-free.
                    </p>

                    {isListening === 'roleExpectations' && (
                        <div style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                display: 'inline-block',
                                animation: 'pulse 1s infinite'
                            }} />
                            Listening... describe what each role must deliver
                        </div>
                    )}

                    <textarea
                        value={roleExpectations}
                        onChange={(e) => setRoleExpectations(e.target.value)}
                        placeholder={`Example:\n\nCybersecurity Consultant:\n- Conduct threat modeling for the vulnerability scanner\n- Define security requirements by week 2\n- Deliver penetration testing plan by week 3\n- Review all code for OWASP Top 10 before launch\n\nFrontend Developer:\n- Build the vulnerability dashboard UI by week 4\n- Implement authentication and role-based access control`}
                        rows={6}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: roleExpectations?.length >= 20
                                ? '1px solid #68d391'
                                : '1px solid #E2E8F0',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            color: '#2C3E50',
                            transition: 'border-color 0.2s ease'
                        }}
                    />
                    {roleExpectations?.length >= 20 && (
                        <p style={{
                            fontSize: '11px',
                            color: '#38a169',
                            marginTop: '4px'
                        }}>
                            ✅ Role expectations set — AI will score against these specifically.
                        </p>
                    )}
                </div>
            )}

            {/* GENERATE LINK BUTTON */}
            <button
                className={styles.primaryButton}
                onClick={handleGenerateLink}
                disabled={loading}
            >
                🔗 {loading ? "Processing..." : "Generate Member Link"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button onClick={handleSaveOnly} className={styles.secondaryButton}>
                    Save mission without generating link
                </button>
            </div>

            {generatedLink && (
                <div className={styles.linkSuccess}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>
                        ✅ Link Copied!
                    </strong>
                    {generatedLink}
                </div>
            )}
        </div>
    );
};

export default MissionControl;