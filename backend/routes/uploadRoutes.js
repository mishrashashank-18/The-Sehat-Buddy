import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();

// Memory storage so we can inspect and stream to Cloudinary directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure cloudinary
const getCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return cloudinary;
};

/**
 * Upload single image (file or base64) to Cloudinary
 * Returns { success: true, url, public_id }
 */
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isCloudinaryConfigured =
      cloudName &&
      apiKey &&
      apiSecret &&
      cloudName !== 'your_cloudinary_cloud_name' &&
      !cloudName.includes('your_');

    const folder = req.body.folder || 'sehatbuddy';

    // 1. File uploaded via multipart/form-data
    if (req.file) {
      if (isCloudinaryConfigured) {
        const cld = getCloudinary();
        const uploadStream = () =>
          new Promise((resolve, reject) => {
            const stream = cld.uploader.upload_stream(
              { folder, resource_type: 'image' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });

        const result = await uploadStream();
        return res.json({
          success: true,
          url: result.secure_url || result.url,
          public_id: result.public_id,
          provider: 'cloudinary'
        });
      } else {
        // Fallback: If Cloudinary keys haven't been filled in yet in .env, persist as Base64 Data URI
        // so photos NEVER disappear even before user enters their API key!
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${b64}`;
        return res.json({
          success: true,
          url: dataUri,
          provider: 'local-data-uri',
          note: 'Cloudinary credentials pending in backend/.env. Saved as permanent Data URI.'
        });
      }
    }

    // 2. Base64 string sent in JSON body
    if (req.body.image && typeof req.body.image === 'string') {
      const imgString = req.body.image;
      if (isCloudinaryConfigured) {
        const cld = getCloudinary();
        const result = await cld.uploader.upload(imgString, {
          folder,
          resource_type: 'image'
        });
        return res.json({
          success: true,
          url: result.secure_url || result.url,
          public_id: result.public_id,
          provider: 'cloudinary'
        });
      } else {
        return res.json({
          success: true,
          url: imgString,
          provider: 'local-data-uri',
          note: 'Cloudinary credentials pending in backend/.env. Saved as permanent Data URI.'
        });
      }
    }

    return res.status(400).json({ success: false, message: 'No image file or image string provided' });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

export default router;
