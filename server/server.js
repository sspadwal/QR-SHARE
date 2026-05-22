import app from './app.js';
import dotenv from 'dotenv';
import dbConnect from './src/common/config/db.js';
import http from 'http';
import {initSocket} from './src/common/config/socketManager.js';
import { startCleanupService } from './src/common/services/cleanupService.js';

dotenv.config();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

const start = async () => {
    await dbConnect(uri);
    // Start the background service to cleanup expired files from Cloudinary and database
    await startCleanupService();

    const server = http.createServer(app);
    initSocket(server);
    server.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${port}`);
    });
}

start();