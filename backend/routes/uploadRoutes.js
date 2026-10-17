import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();

// Memory storage for images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Disk storage for videos to handle large files smoothly without RAM bloat
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `sehat-video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB limit
  fileFilter: (req, file, cb) => {
    if (
      (file.mimetype && file.mimetype.startsWith('video/')) ||
      (file.originalname && file.originalname.match(/\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i))
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (.mp4, .webm, .mov, etc.) are allowed!'), false);
    }
  }
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

/**
 * Upload single video to Cloudinary
 * Returns { success: true, url, public_id, format, duration }
 */
router.post('/video', (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Video file size exceeds maximum limit of 250MB' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const filePath = req.file?.path;
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

    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are not configured in backend/.env'
      });
    }

    if (!req.file && (!req.body || !req.body.video)) {
      return res.status(400).json({ success: false, message: 'No video file or URL provided' });
    }

    const folder = req.body?.folder || 'sehatbuddy/videos';
    const cld = getCloudinary();

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cld.uploader.upload_large(
          filePath,
          {
            resource_type: 'video',
            folder,
            chunk_size: 6000000
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      return res.json({
        success: true,
        url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id,
        duration: uploadResult.duration,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        provider: 'cloudinary'
      });
    }

    if (req.body.video && typeof req.body.video === 'string') {
      const uploadResult = await new Promise((resolve, reject) => {
        cld.uploader.upload(
          req.body.video,
          {
            resource_type: 'video',
            folder
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      return res.json({
        success: true,
        url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id,
        provider: 'cloudinary'
      });
    }

    return res.status(400).json({ success: false, message: 'No video file provided' });
  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Video upload to Cloudinary failed'
    });
  } finally {
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
      } catch {}
    }
  }
});

export default router;
