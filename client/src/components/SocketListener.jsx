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
            <svg className="file-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
            </svg>
        );
    }
    if (mime.startsWith('video/')) {
        return (
            <svg className="file-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        );
    }
    if (mime.includes('pdf')) {
        return (
            <svg className="file-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        );
    }
    return (
        <svg className="file-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
        </svg>
    );
};

const SocketListener = ({ sessionId, serverUrl }) => {
    const { status, receivedFiles } = useSocket(serverUrl, sessionId);

    if (!sessionId) {
        return <p className="waiting-text">Waiting for session...</p>;
    }

    const files = receivedFiles || [];

    const handleDownload = async (fileUrl, originalName) => {
        try {
            const response = await fetch(fileUrl);
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
            console.error('Download failed:', error);
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className="socket-listener">
            <div className="listener-header">
                <h3>Received Files</h3>
                <span className={`status-badge ${status}`}>
                    <span className="pulse-dot"></span>
                    {status === 'connected' ? 'Live Connected' : 'Connecting...'}
                </span>
            </div>

            {files.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-icon" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p>No files yet. Upload from your phone and they will instantly appear here.</p>
                </div>
            ) : (
                <ul className="file-list">
                    {files.map((file, index) => (
                        <li key={file.publicId || `${file.originalName}-${index}`} className="file-item">
                            <div className="file-info-col">
                                {getFileIcon(file.mimeType)}
                                <div className="file-details">
                                    <span className="file-name" title={file.originalName}>{file.originalName}</span>
                                    <span className="file-size">{formatSize(file.size)}</span>
                                </div>
                            </div>
                            <a
                                className="download-btn-small"
                                href={file.downloadUrl}
                                download={file.originalName}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDownload(file.downloadUrl, file.originalName);
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SocketListener;
