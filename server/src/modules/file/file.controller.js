import * as fileService from './file.services.js';
import cloudinary from './../../common/config/cloudinary.js';
import { getIO } from './../../common/config/socketManager.js';

const uploadFile = async (req, res) => {
    try {
        const io = getIO();
        const savedFiles = await fileService.uploadFile(req.sessionId, req.files);
        io.to(req.sessionId).emit("files-ready", savedFiles);
        return res.status(201).json({
            message: 'Files uploaded successfully',
            files: savedFiles,
        });
    } catch (error) {
        console.error('Upload failed:', error);
        return res.status(500).json({ error: error.message || 'File upload failed' });
    }
};

export { uploadFile };