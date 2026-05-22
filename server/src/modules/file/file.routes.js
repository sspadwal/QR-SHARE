import { Router } from 'express';
import { uploadFile } from './file.controller.js';
import { tokenCheck } from './file.middleware.js';
import upload from '../../common/config/multer.js';
const router = Router();

router.post('/upload', tokenCheck, (req, res, next) => {
    upload.array('files', 3)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Please select files below 10.00 MB.' });
            }
            return res.status(400).json({ error: err.message || 'File upload error occurred.' });
        }
        next();
    });
}, uploadFile);

export default router;