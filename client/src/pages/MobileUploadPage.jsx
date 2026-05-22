import { useState, useEffect } from 'react';
import axios from 'axios';
import FileAttachComponent from '../components/FileAttachComponent.jsx';

const MobileUploadPage = ({ sessionId, baseUrl, theme, toggleTheme }) => {
    const [valid, setValid] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await axios.get(`${baseUrl}/api/session/validate`, {
                    params: { sessionId },
                    headers: { 'x-session-id': sessionId },
                });
                setValid(response.data.valid);
                if (!response.data.valid) {
                    setError('This sharing session is invalid or expired.');
                }
            } catch {
                setValid(false);
                setError('Could not connect to server.');
            }
        };

        checkSession();
    }, [sessionId, baseUrl]);

    if (valid === null) {
        return (
            <div className="mobile-loading-container">
                <div className="spinner"></div>
                <p>Checking session...</p>
            </div>
        );
    }

    if (!valid) {
        return (
            <div className="mobile-error-container">
                <div className="error-card">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="error-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h2>Session Expired</h2>
                    <p>{error}</p>
                    <a href="/" className="back-btn">Go to QR-Share</a>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-layout">
            <header className="navbar">
                <div className="logo-container">
                    <div className="logo-box">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                        </svg>
                    </div>
                    <span className="logo-text">QR-Share</span>
                </div>
                <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                    {theme === 'dark' ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    )}
                </button>
            </header>

            <main className="mobile-content">
                <div className="mobile-upload-card animate-fade-in">
                    <h1 className="mobile-title">Upload files to PC</h1>
                    <p className="mobile-subtitle">Your files will appear on your laptop screen instantly. Max size 10MB per file.</p>
                    <FileAttachComponent sessionId={sessionId} baseUrl={baseUrl} isMobile />
                </div>
            </main>

            <footer className="footer">
                <p>100% Encrypted & Safe. Automatically deleted in 15 mins.</p>
            </footer>
        </div>
    );
};

export default MobileUploadPage;
