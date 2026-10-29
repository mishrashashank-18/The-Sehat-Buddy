import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Content from '../models/Content.js';
import Corporate from '../models/Corporate.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Ensures all standard front-page content types ('hero', 'services', 'features', 'articles', 'branding', 'corporate')
 * are seeded in MongoDB Atlas from content.json if they do not yet exist.
 */
export const seedContentIfEmpty = async () => {
  try {
    const jsonPath = path.resolve(__dirname, '../data/content.json');
    if (!fs.existsSync(jsonPath)) return;
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const defaultContent = JSON.parse(raw);

    for (const [type, data] of Object.entries(defaultContent)) {
      if (type === 'corporate') continue; // Never auto-seed corporate partners
      const existing = await Content.findOne({ type });
      if (!existing) {
        await Content.findOneAndUpdate(
          { type },
          { data },
          { upsert: true, new: true }
        );
        console.log(`[Content] Auto-seeded "${type}" into database.`);
      }
    }
  } catch (err) {
    console.warn('[Content] Auto-seed check warning:', err.message);
  }
};

router.get('/', async (req, res) => {
  try {
    let contents = await Content.find({});
    if (contents.length === 0) {
      await seedContentIfEmpty();
      contents = await Content.find({});
    }

    const arrayTypes = ['corporate', 'services', 'features', 'articles'];
    const data = contents.reduce((acc, curr) => {
      let val = curr.data;
      if (arrayTypes.includes(curr.type)) {
        if (!Array.isArray(val)) {
          val = val && typeof val === 'object' ? [val] : [];
        }
      }
      acc[curr.type] = val;
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
    const arrayTypes = ['corporate', 'services', 'features', 'articles'];
    if (arrayTypes.includes(type)) {
      if (Array.isArray(bodyData)) {
        finalData = bodyData;
      } else if (bodyData && Array.isArray(bodyData[type])) {
        finalData = bodyData[type];
      } else if (bodyData && Array.isArray(bodyData.data)) {
        finalData = bodyData.data;
      } else if (bodyData && typeof bodyData === 'object') {
        finalData = [bodyData];
      } else {
        finalData = [];
      }
    } else if (bodyData && typeof bodyData === 'object' && !Array.isArray(bodyData)) {
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

    if (type === 'corporate') {
      try {
        await Corporate.deleteMany({});
        if (Array.isArray(finalData) && finalData.length > 0) {
          const docs = finalData.map((item, idx) => ({
            id: item.id || Date.now() + idx,
            name: item.name,
            shortName: item.shortName || (item.name ? item.name.split(' ')[0] : 'Partner'),
            logoText: item.logoText || (item.name ? item.name.slice(0, 4).toUpperCase() : 'CORP'),
            category: item.category || 'Enterprise Partner',
            benefit: item.benefit || '',
            employeesCovered: item.employeesCovered || '50,000+',
            color: item.color || '#2563EB',
            bgColor: item.bgColor || '#EFF6FF',
            logo: item.logo || '',
            order: idx + 1
          }));
          await Corporate.insertMany(docs);
        }
        broadcastDbChange('corporates', 'update', 'all', finalData);
      } catch (cErr) {
        console.warn('Corporate sync warning in contentRoutes:', cErr.message);
      }
    }

    broadcastDbChange('contents', 'update', content._id, { type, data: finalData });
    res.json({ success: true, data: content, message: `${type} updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
