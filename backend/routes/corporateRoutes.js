import express from 'express';
import Corporate from '../models/Corporate.js';
import Content from '../models/Content.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

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
      shortName: c.shortName || (c.name ? c.name.split(' ')[0] : 'Partner'),
      logoText: c.logoText || (c.shortName || c.name || 'CORP').slice(0, 10),
      category: c.category || 'Enterprise Partner',
      benefit: c.benefit || '',
      employeesCovered: c.employeesCovered || '50,000+',
      color: c.color || '#2563EB',
      bgColor: c.bgColor || '#EFF6FF',
      logo: c.logo || ''
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
      shortName: data.shortName || (data.name ? data.name.split(' ')[0] : 'Partner'),
      logoText: data.logoText || (data.name ? data.name.slice(0, 4).toUpperCase() : 'CORP'),
      category: data.category || 'Enterprise Partner',
      benefit: data.benefit || '',
      employeesCovered: data.employeesCovered || '50,000+',
      color: data.color || '#2563EB',
      bgColor: data.bgColor || '#EFF6FF',
      logo: data.logo || '',
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
    
    // Replace all in Corporate collection
    await Corporate.deleteMany({});
    if (list.length > 0) {
      const docs = list.map((item, idx) => ({
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

    await Content.findOneAndUpdate(
      { type: 'corporate' },
      { data: list },
      { new: true, upsert: true }
    );

    broadcastDbChange('corporates', 'update', 'all', list);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: list });

    res.json({ success: true, data: list, message: 'Corporate partners updated' });
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

    const updated = await Corporate.findOneAndUpdate(query, req.body, { new: true });
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
    await Corporate.deleteMany({});
    await Content.findOneAndUpdate(
      { type: 'corporate' },
      { data: [] },
      { new: true, upsert: true }
    );

    broadcastDbChange('corporates', 'delete', 'all', []);
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: [] });

    res.json({ success: true, message: 'All corporate partners deleted' });
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

    await Corporate.findOneAndDelete(query);
    const allFormatted = await syncContentFromCorporates();

    broadcastDbChange('corporates', 'delete', id, { id });
    broadcastDbChange('contents', 'update', 'corporate', { type: 'corporate', data: allFormatted });

    res.json({ success: true, message: 'Corporate partner deleted', data: allFormatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
