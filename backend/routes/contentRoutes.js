import express from 'express';
import Content from '../models/Content.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contents = await Content.find({});
    const data = contents.reduce((acc, curr) => {
      acc[curr.type] = curr.data;
      return acc;
    }, {});

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const checkAdminAuth = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return protect(req, res, () => requireAdmin(req, res, next));
};

router.put('/:type', checkAdminAuth, async (req, res) => {
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
        bodyData.heroImage = 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792239399/sehatbuddy/hero/i3g2e9ptcdydfnfeqf9c.jpg';
      }
    }

    let finalData = bodyData;
    if (bodyData && typeof bodyData === 'object' && !Array.isArray(bodyData)) {
      const existing = await Content.findOne({ type });
      if (existing && existing.data && typeof existing.data === 'object' && !Array.isArray(existing.data)) {
        finalData = { ...existing.data, ...bodyData };
      }
    }

    const content = await Content.findOneAndUpdate(
      { type }, 
      { data: finalData }, 
      { new: true, upsert: true }
    );
    broadcastDbChange('contents', 'update', content._id, { type, data: finalData });
    res.json({ success: true, data: content, message: `${type} updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
