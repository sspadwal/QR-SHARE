import File from './file.model.js';
import cloudinary from './../../common/config/cloudinary.js';
import streamifier from "streamifier";
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });

const uploadFile = async (sessionID, files) => {
 
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No files uploaded');
  }

  const uploadOne = (file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) return reject(error);
        resolve({ file, result });
      });
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

  const uploadResults = await Promise.all(files.map(uploadOne));
  // Build array of file subdocuments to store on a single session document
  const expiryDate = new Date(Date.now() + 15 * 60 * 1000);
  const fileDocs = uploadResults.map(({ file, result }) => ({
    originalName: file.originalname,
    publicId: result.public_id,
    downloadUrl: result.secure_url,
    size: file.size,
    mimeType: file.mimetype,
    expiresAt: expiryDate,
  }));

  // Create a new document for this upload (one document per upload/session)
  const created = await File.create({
    sessionId: sessionID,
    expiresAt: expiryDate,
    files: fileDocs,
  });

  return created.files;
};

export { uploadFile };