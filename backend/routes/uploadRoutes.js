import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import { notifyStorageChanged } from '../services/storageMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
];

const ALLOWED_IMAGE_EXTS = /\.(jpg|jpeg|png|webp|svg|gif|ico)$/i;

// Memory storage for images with strict type verification
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (
      ALLOWED_IMAGE_MIMES.includes(file.mimetype) ||
      (file.originalname && file.originalname.match(ALLOWED_IMAGE_EXTS))
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only verified image files (.jpg, .png, .webp, .svg, .gif, .ico) are allowed.'), false);
    }
  }
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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit (matches Cloudinary Free Tier max video size)
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
export const getCloudinary = () => {
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
router.post('/image', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
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
      // SVG Script Sanitization against Stored XSS
      const isSvg = req.file.mimetype === 'image/svg+xml' || (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.svg'));
      if (isSvg) {
        const svgStr = req.file.buffer.toString('utf8');
        if (/<script|javascript:|on\w+\s*=/i.test(svgStr)) {
          return res.status(400).json({
            success: false,
            message: 'Malicious content (script tag or inline event handler) detected in SVG file.'
          });
        }
      }
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
        notifyStorageChanged('cloudinary:image');
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
        notifyStorageChanged('cloudinary:image');
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
router.post('/video', protect, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Video file size exceeds maximum limit of 100MB (Cloudinary Free Plan quota).' });
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

    if (!req.file && (!req.body || !req.body.video)) {
      return res.status(400).json({ success: false, message: 'No video file or URL provided' });
    }

    const folder = req.body?.folder || 'sehatbuddy/videos';
    const cld = getCloudinary();

    if (req.file) {
      if (!isCloudinaryConfigured) {
        return res.status(400).json({
          success: false,
          message: 'Cloudinary is not configured. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in backend/.env.'
        });
      }

      const stats = fs.statSync(filePath);
      const isUnder25MB = stats.size < 25 * 1024 * 1024;

      const uploadOptions = {
        resource_type: 'video',
        folder,
        quality: 'auto',
        eager_async: true
      };

      let uploadResult;
      if (isUnder25MB) {
        // Direct stream upload is 3-5x faster for reels under 25MB (avoids multi-chunk negotiation latency)
        uploadResult = await cld.uploader.upload(filePath, uploadOptions);
      } else {
        // Larger files use upload_large with 10MB chunking for optimal throughput
        uploadResult = await new Promise((resolve, reject) => {
          cld.uploader.upload_large(
            filePath,
            {
              ...uploadOptions,
              chunk_size: 10000000
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
      }

      const rawUrl = uploadResult.secure_url || uploadResult.url;
      // Auto-inject Cloudinary fast-start autoplay streaming flags (q_auto,f_auto)
      const autoPlayUrl = rawUrl.includes('/video/upload/') && !rawUrl.includes('/video/upload/q_auto')
        ? rawUrl.replace('/video/upload/', '/video/upload/q_auto,f_auto/')
        : rawUrl;
      const coverPhoto = autoPlayUrl.replace(/\.[^/.]+$/, '.jpg');

      notifyStorageChanged('cloudinary:video');
      return res.json({
        success: true,
        url: autoPlayUrl,
        raw_url: rawUrl,
        coverPhoto,
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

      notifyStorageChanged('cloudinary:video');
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

/**
 * Auto-extract Instagram Reel and Upload to Cloudinary
 * Returns permanent Cloudinary video url and auto-generated thumbnail
 */
router.post('/instagram-reel', protect, async (req, res) => {
  try {
    const { url, folder = 'sehatbuddy/reels' } = req.body;
    if (!url || !url.includes('instagram.com')) {
      return res.status(400).json({ success: false, message: 'Valid Instagram Reel URL is required' });
    }

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs');

    const tempFilePath = path.join(os.tmpdir(), `sehat_reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`);

    // Download reel locally using yt-dlp across available Python / yt-dlp environments
    const commands = [
      `py -m yt_dlp -o "${tempFilePath}" "${url}"`,
      `yt-dlp -o "${tempFilePath}" "${url}"`,
      `"C:\\Users\\Sarthak\\AppData\\Local\\Programs\\Python\\Python310\\Scripts\\yt-dlp.exe" -o "${tempFilePath}" "${url}"`,
      `python -m yt_dlp -o "${tempFilePath}" "${url}"`
    ];

    let downloaded = false;
    let lastErr = null;
    for (const cmd of commands) {
      try {
        await execPromise(cmd, { timeout: 40000 });
        if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 1000) {
          downloaded = true;
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!downloaded || !fs.existsSync(tempFilePath)) {
      return res.status(400).json({ success: false, message: lastErr ? lastErr.message : 'Could not download reel video locally' });
    }

    try {
      const cld = getCloudinary();
      const uploadResult = await cld.uploader.upload(tempFilePath, {
        resource_type: 'video',
        folder,
        quality: 'auto',
        eager_async: true
      });

      const rawUrl = uploadResult.secure_url || uploadResult.url;
      const autoPlayUrl = rawUrl.includes('/video/upload/') && !rawUrl.includes('/video/upload/q_auto')
        ? rawUrl.replace('/video/upload/', '/video/upload/q_auto,f_auto/')
        : rawUrl;
      const coverPhoto = autoPlayUrl.replace(/\.[^/.]+$/, '.jpg');

      notifyStorageChanged('cloudinary:video');
      return res.json({
        success: true,
        url: autoPlayUrl,
        raw_url: rawUrl,
        coverPhoto,
        public_id: uploadResult.public_id,
        duration: uploadResult.duration
      });
    } finally {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {}
    }
  } catch (err) {
    console.error('Instagram reel conversion error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to convert reel to Cloudinary' });
  }
});

/**
 * Helper to extract Cloudinary public_id from URL
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    const clean = afterUpload.split('?')[0];
    const parts = clean.split('/');
    const filteredParts = [];
    let passedVersionOrTransforms = false;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!passedVersionOrTransforms) {
        if (/^v\d+$/.test(part)) {
          passedVersionOrTransforms = true;
          continue;
        }
        if (part.includes(',') || /^[a-z]_[a-z0-9_-]+$/i.test(part)) {
          continue;
        }
      }
      passedVersionOrTransforms = true;
      filteredParts.push(part);
    }
    const fullPathWithExt = filteredParts.join('/');
    const lastDot = fullPathWithExt.lastIndexOf('.');
    return lastDot !== -1 ? fullPathWithExt.substring(0, lastDot) : fullPathWithExt;
  } catch (e) {
    return null;
  }
};

const checkAuth = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && !req.headers.authorization) {
    return next();
  }
  return protect(req, res, next);
};

/**
 * Delete image or video completely from Cloudinary or local disk
 * POST /api/upload/delete or DELETE /api/upload
 * Body: { url, public_id, resource_type: 'image' | 'video' }
 */
const handleDeleteMedia = async (req, res) => {
  try {
    const { url, resource_type = 'image' } = req.body;
    let public_id = req.body.public_id;

    // Handle local file deletion if stored locally
    if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
      const localFilePath = path.resolve(__dirname, `..${url}`);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
          notifyStorageChanged(resource_type === 'video' ? 'local:video' : 'local:image');
          return res.json({
            success: true,
            message: 'Local file deleted from server disk.'
          });
        } catch (unlinkErr) {
          console.error('Failed to unlink local file:', unlinkErr);
        }
      }
    }

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
      return res.status(400).json({
        success: false,
        message: 'Cloudinary credentials are not configured in backend/.env'
      });
    }

    if (!public_id && url) {
      public_id = extractCloudinaryPublicId(url);
    }

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'A valid Cloudinary public_id or Cloudinary URL is required for deletion.'
      });
    }

    const cld = getCloudinary();
    const result = await cld.uploader.destroy(public_id, {
      resource_type,
      invalidate: true
    });

    notifyStorageChanged(`cloudinary:${resource_type}`);

    return res.json({
      success: true,
      result: result.result || 'ok',
      public_id,
      message: `Asset "${public_id}" deleted completely from Cloudinary.`
    });
  } catch (error) {
    console.error('Cloudinary media deletion error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete asset from Cloudinary'
    });
  }
};

router.post('/delete', checkAuth, handleDeleteMedia);
router.delete('/', checkAuth, handleDeleteMedia);

export default router;
