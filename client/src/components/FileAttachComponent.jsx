import { useState } from 'react';
import axios from 'axios';

const FileAttachComponent = ({ sessionId, baseUrl, isMobile = false }) => {
    const [files, setFiles] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const fileHandler = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!files?.length) {
            setUploadError('Please select at least one file.');
            return;
        }

        // Validate that all files are below 10.00 MB
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10.00 MB
        const invalidFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            setUploadError('Please select files below 10.00 MB.');
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });

        setUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            await axios.post(`${baseUrl}/api/files/upload`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-session-id': sessionId,
                },
            });
            setUploadSuccess(true);
            if (form) {
                form.reset();
            }
            setFiles(null);
        } catch (error) {
            const message = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Upload failed';
            setUploadError(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-attach-component">
            <form onSubmit={fileHandler}>
                <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                />
                <button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose & upload files'}
                </button>
            </form>

            {uploadError && <p className="error">{uploadError}</p>}
            {uploadSuccess && (
                <p className="success">
                    {isMobile
                        ? 'Files sent! Check your laptop - they should appear instantly.'
                        : 'Upload complete!'}
                </p>
            )}
        </div>
    );
};

export default FileAttachComponent;
