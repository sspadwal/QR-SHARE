import File from '../../modules/file/file.model.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Drop the expiresAt TTL index on the File collection so MongoDB doesn't delete
 * the records before we can delete the files from Cloudinary.
 */
export const disableFileTtlIndex = async () => {
    try {
        await File.collection.dropIndex('expiresAt_1');
        console.log('Successfully dropped MongoDB TTL index expiresAt_1 to allow Cloudinary cleanup.');
    } catch (error) {
        // If the index doesn't exist or is not found, this is fine
        if (error.codeName !== 'IndexNotFound') {
            console.log('Note: expiresAt TTL index not found or already dropped.');
        }
    }
};

/**
 * Delete a file from Cloudinary based on its mimetype and publicId.
 */
const deleteFromCloudinary = async (publicId, mimeType) => {
    let resourceType = 'image';
    const mime = mimeType || '';
    if (mime.startsWith('video/')) {
        resourceType = 'video';
    } else if (!mime.startsWith('image/')) {
        resourceType = 'raw';
    }

    try {
        console.log(`Deleting ${publicId} (${resourceType}) from Cloudinary...`);
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`Cloudinary deletion result for ${publicId}:`, result);
    } catch (error) {
        console.error(`Failed to delete ${publicId} from Cloudinary:`, error);
    }
};

/**
 * Check the database for expired files, delete them from Cloudinary,
 * and then delete the corresponding records from MongoDB.
 */
export const cleanupExpiredFiles = async () => {
    try {
        const now = new Date();
        const expiredSessions = await File.find({ expiresAt: { $lte: now } });

        if (expiredSessions.length === 0) {
            return;
        }

        console.log(`Found ${expiredSessions.length} expired file sessions. Commencing cleanup...`);

        for (const session of expiredSessions) {
            // Delete all files in this session from Cloudinary
            for (const file of session.files) {
                await deleteFromCloudinary(file.publicId, file.mimeType);
            }

            // Remove the session record from database
            await File.deleteOne({ _id: session._id });
            console.log(`Deleted session record ${session._id} from database.`);
        }
    } catch (error) {
        console.error('Error during expired files cleanup:', error);
    }
};

/**
 * Start the background file cleanup interval.
 * Runs every 60 seconds.
 */
export const startCleanupService = async () => {
    // Drop the TTL index on startup so database records don't disappear prematurely
    await disableFileTtlIndex();

    // Run once on startup
    await cleanupExpiredFiles();

    // Run every minute (60,000 ms)
    setInterval(cleanupExpiredFiles, 60000);
    console.log('Expired files cleanup background service started (interval: 1 minute).');
};
