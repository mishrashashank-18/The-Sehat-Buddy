import express from 'express';
import Corporate from '../models/Corporate.js';
import Content from '../models/Content.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { extractCloudinaryPublicId, getCloudinary } from './uploadRoutes.js';

const router = express.Router();

const checkAdminAuth = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return protect(req, res, () => requireAdmin(req, res, next));
};

// Helper to keep Content ('corporate') in sync with Corporate model
export const syncContentFromCorporates = async () => {
  try {
    const list = await Corporate.find({}).sort({ order: 1, id: 1, createdAt: 1 });
    const formatted = list.map(c => ({
      _id: c._id,
      id: c.id || c._id,
      name: c.name,
      logo: c.logo || '',
      website: c.website || '',
      order: c.order || 0
    }));

    await Content.findOneAndUpdate(
      { type: 'corporate' },
      { data: formatted },
      { new: true, upsert: true }
    );
    return formatted;
  } catch (err) {
    console.error('Error syncing content from corporates:', err.message);
    return [];
  }
};

// GET /api/corporate - Fetch all corporate partners
router.get('/', async (req, res) => {
  try {
    const corporates = await Corporate.find({}).sort({ order: 1, id: 1, createdAt: 1 });
    res.json({ success: true, data: corporates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/corporate - Create a new corporate partner
router.post('/', checkAdminAuth, async (req, res) => {
  try {
    const data = req.body;
    const count = await Corporate.countDocuments({});
    const newCorp = await Corporate.create({
      id: data.id || Date.now(),
      name: data.name,
      logo: data.logo || '',
      website: data.website || '',
      order: count + 1
    });

    const allFormatted = await syncContentFromCorporates();
    broadcastDbChange('corporates', 'insert', newCorp._id, newCorp);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: allFormatted });

    res.status(201).json({ success: true, data: newCorp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/corporate - Bulk update / reorder partners
router.put('/', checkAdminAuth, async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : [];
    
    // Check which logos were in DB before and are no longer in list -> destroy from Cloudinary
    const currentCorps = await Corporate.find({});
    const newLogos = new Set(list.map(item => item.logo).filter(Boolean));
    for (const oldCorp of currentCorps) {
      if (oldCorp.logo && oldCorp.logo.includes('cloudinary.com') && !newLogos.has(oldCorp.logo)) {
        const publicId = extractCloudinaryPublicId(oldCorp.logo);
        if (publicId) {
          try {
            const cld = getCloudinary();
            await cld.uploader.destroy(publicId, { invalidate: true });
          } catch (cldErr) {
            console.warn('Failed to delete removed corporate logo from Cloudinary:', cldErr.message);
          }
        }
      }
    }

    // Replace all in Corporate collection
    await Corporate.deleteMany({});
    if (list.length > 0) {
      const docs = list.map((item, idx) => ({
        id: item.id || Date.now() + idx,
        name: item.name,
        logo: item.logo || '',
        website: item.website || '',
        order: idx + 1
      }));
      await Corporate.insertMany(docs);
    }

    const allFormatted = await syncContentFromCorporates();

    broadcastDbChange('corporates', 'update', 'all', allFormatted);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: allFormatted });

    res.json({ success: true, data: allFormatted, message: 'Corporate partners updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/corporate/:id - Update single partner
router.put('/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query = { _id: id };
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { id: Number(id) || id };
    }

    const existing = await Corporate.findOne(query);
    // If the logo changed, delete the old logo from Cloudinary
    if (existing && existing.logo && req.body.logo && existing.logo !== req.body.logo && existing.logo.includes('cloudinary.com')) {
      const oldPublicId = extractCloudinaryPublicId(existing.logo);
      if (oldPublicId) {
        try {
          const cld = getCloudinary();
          await cld.uploader.destroy(oldPublicId, { invalidate: true });
        } catch (cldErr) {
          console.warn('Failed to delete replaced corporate logo from Cloudinary:', cldErr.message);
        }
      }
    }

    const updated = await Corporate.findOneAndUpdate(query, {
      name: req.body.name,
      logo: req.body.logo || '',
      website: req.body.website || '',
      order: req.body.order !== undefined ? req.body.order : existing?.order || 0
    }, { new: true });

    const allFormatted = await syncContentFromCorporates();

    broadcastDbChange('corporates', 'update', updated?._id || id, updated);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: allFormatted });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/corporate - Delete all corporate partners
router.delete('/', checkAdminAuth, async (req, res) => {
  try {
    const allCorps = await Corporate.find({});
    for (const corp of allCorps) {
      if (corp.logo && corp.logo.includes('cloudinary.com')) {
        const publicId = extractCloudinaryPublicId(corp.logo);
        if (publicId) {
          try {
            const cld = getCloudinary();
            await cld.uploader.destroy(publicId, { invalidate: true });
          } catch (cldErr) {
            console.warn('Failed to delete corporate logo from Cloudinary:', cldErr.message);
          }
        }
      }
    }

    await Corporate.deleteMany({});
    await Content.findOneAndUpdate(
      { type: 'corporate' },
      { data: [] },
      { new: true, upsert: true }
    );

    broadcastDbChange('corporates', 'delete', 'all', []);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: [] });

    res.json({ success: true, message: 'All corporate partners deleted from database and Cloudinary' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/corporate/:id - Delete single partner
router.delete('/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query = { _id: id };
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { id: Number(id) || id };
    }

    const corp = await Corporate.findOne(query);
    if (corp && corp.logo && corp.logo.includes('cloudinary.com')) {
      const publicId = extractCloudinaryPublicId(corp.logo);
      if (publicId) {
        try {
          const cld = getCloudinary();
          await cld.uploader.destroy(publicId, { invalidate: true });
        } catch (cldErr) {
          console.warn('Failed to delete corporate logo from Cloudinary:', cldErr.message);
        }
      }
    }

    await Corporate.findOneAndDelete(query);
    const allFormatted = await syncContentFromCorporates();

    broadcastDbChange('corporates', 'delete', id, { id });
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: allFormatted });

    res.json({ success: true, message: 'Corporate partner and Cloudinary logo deleted', data: allFormatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
