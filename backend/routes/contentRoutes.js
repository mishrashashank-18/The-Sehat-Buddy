import express from 'express';
import Content from '../models/Content.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

let cachedContent = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60s cache to avoid repetitive MongoDB Atlas latency

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedContent && (now - lastFetchTime < CACHE_TTL)) {
      return res.json({ success: true, data: cachedContent });
    }

    const contents = await Content.find({});
    const data = contents.reduce((acc, curr) => {
      acc[curr.type] = curr.data;
      return acc;
    }, {});

    cachedContent = data;
    lastFetchTime = now;
    res.json({ success: true, data });
  } catch (err) {
    if (cachedContent) {
      return res.json({ success: true, data: cachedContent });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:type', protect, requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let bodyData = req.body;

    // Safety guard: if heroImage is a Base64 data URI, automatically upload to Cloudinary so 10MB strings never hit MongoDB!
    if (type === 'hero' && bodyData && typeof bodyData.heroImage === 'string' && bodyData.heroImage.startsWith('data:image')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret && !cloudName.includes('your_')) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret
        });
        const uploadRes = await cloudinary.uploader.upload(bodyData.heroImage, {
          folder: 'sehatbuddy/hero',
          resource_type: 'image'
        });
        bodyData.heroImage = uploadRes.secure_url || uploadRes.url;
      } else if (bodyData.heroImage.length > 50000) {
        // Fallback: Prevent oversized base64 strings from bloating DB
        bodyData.heroImage = '/src/assets/images/hero-family.jpg';
      }
    }

    const content = await Content.findOneAndUpdate(
      { type }, 
      { data: bodyData }, 
      { new: true, upsert: true }
    );
    if (!cachedContent) cachedContent = {};
    cachedContent[type] = bodyData;
    lastFetchTime = Date.now();
    res.json({ success: true, data: content, message: `${type} updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
