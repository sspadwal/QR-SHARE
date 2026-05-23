import { useState, useEffect } from 'react';
import axios from 'axios';
import QrComponents from '../components/QrComponents.jsx';
import useSocket from '../hooks/useSocket.js';

const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
};

const getFileIcon = (mimeType) => {
    const mime = mimeType || '';
    if (mime.startsWith('image/')) {
        return (
            <svg className="file-icon img-icon" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );
    }
    if (mime.startsWith('video/')) {
        return (
            <svg className="file-icon video-icon" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        );
    }
    if (mime.includes('pdf')) {
        return (
            <svg className="file-icon pdf-icon" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        );
    }
    return (
        <svg className="file-icon generic-icon" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
        </svg>
    );
};

// Transform Cloudinary URLs to force browser attachment/download disposition instead of opening in a new tab
const forceDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/fl_attachment/');
    }
    return url;
};

const LaptopPage = ({ baseUrl, theme, toggleTheme }) => {
    const [sessionId, setSessionId] = useState(null);
    const [sessionError, setSessionError] = useState(null);

    // Call create session on load
    useEffect(() => {
        const createSession = async () => {
            try {
                const response = await axios.get(baseUrl, { withCredentials: true });
                setSessionId(response.data.sessionId);
            } catch (error) {
                setSessionError('Could not establish secure session.');
                console.error(error);
            }
        };

        createSession();
    }, [baseUrl]);

    // Use socket hook to receive files directly
    const { status, receivedFiles } = useSocket(baseUrl, sessionId);
    const files = receivedFiles || [];
    const hasFiles = files.length > 0;

    const handleDownload = async (fileUrl, originalName) => {
        try {
            // Apply Cloudinary fl_attachment transform
            const downloadUrl = forceDownloadUrl(fileUrl);

            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error('Network error');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = originalName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn('CORS or fetch download failed, falling back to direct attachment link:', error);
            // Fallback: Open transformed attachment URL directly
            const downloadUrl = forceDownloadUrl(fileUrl);
            window.location.href = downloadUrl;
        }
    };

    const handleDownloadAll = async () => {
        for (const file of files) {
            // Small delay to ensure browser schedules multiple download flows smoothly
            await new Promise(resolve => setTimeout(resolve, 350));
            handleDownload(file.downloadUrl, file.originalName);
        }
    };

    return (
        <div className="laptop-layout">
            <header className="navbar">
                <a className="logo-container" href="/">
                    <div className="logo-box">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                        </svg>
                    </div>
                    <span className="logo-text">QR-Share</span>
                </a>
                <div className="nav-right-actions">
                    <span className={`status-badge-minimal ${status === 'connected' ? 'connected' : ''}`}>
                        {status === 'connected' ? '● Connected' : '○ Connecting...'}
                    </span>
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
                </div>
            </header>

            {sessionError && (
                <div className="error-banner">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{sessionError}</span>
                </div>
            )}

            <main className={`main-content-layout ${hasFiles ? 'layout-split' : 'layout-centered'}`}>
                {!hasFiles ? (
                    /* Initial Centered Scanner State */
                    <div className="centered-hero-section">
                        <h1 className="hero-heading">
                            Scan & Transfer Files <span className="highlight-badge">instantly.</span>
                        </h1>
                        <p className="hero-subtext">Scan the QR code to instantly share files from your mobile device to this browser. No signup, registration, or apps required.</p>
                        <p className="hero-trust-badge">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            100% Secure & Private. All files are automatically deleted after 15 minutes.
                        </p>
                        <div className="centered-scanner-container">
                            <QrComponents sessionId={sessionId} />
                        </div>
                    </div>
                ) : (
                    /* Active Split Screen State (Scanner Left, Files Right) */
                    <div className="split-hero-section">
                        <div className="split-left-panel">
                            <div className="mini-scanner-container">
                                <QrComponents sessionId={sessionId} />
                            </div>
                            <div className="split-left-info">
                                <p className="hero-trust-badge">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    All files will automatically expire and delete in 15 minutes.
                                </p>
                            </div>
                        </div>

                        <div className="split-right-panel">
                            <div className="files-card">
                                <div className="files-card-header">
                                    <h2>Received Files ({files.length})</h2>
                                    {files.length > 1 && (
                                        <button className="download-all-btn" onClick={handleDownloadAll}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download All
                                        </button>
                                    )}
                                </div>
                                <ul className="product-file-list">
                                    {files.map((file, index) => (
                                        <li key={file.publicId || `${file.originalName}-${index}`} className="product-file-item">
                                            <div className="file-info-left">
                                                {getFileIcon(file.mimeType)}
                                                <div className="file-text-details">
                                                    <span className="file-display-name" title={file.originalName}>{file.originalName}</span>
                                                    <span className="file-display-size">{formatSize(file.size)}</span>
                                                </div>
                                            </div>
                                            <button
                                                className="file-action-dl-btn"
                                                onClick={() => handleDownload(file.downloadUrl, file.originalName)}
                                                aria-label="Download File"
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="footer">
                <p>QR-Share is a safe, free, instant file transfer tool. Developed with privacy as the core feature.</p>
            </footer>
        </div>
    );
};

export default LaptopPage;
