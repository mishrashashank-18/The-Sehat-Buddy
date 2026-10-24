import FaqSymbol from '../models/FaqSymbol.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

export const DEFAULT_FAQ_SYMBOLS = [
  {
    key: 'calendar',
    name: 'Appointment Booking',
    category: 'Booking & Visits',
    order: 1,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><rect x="10" y="11" width="28" height="26" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="2"/><path d="M10 18h28" stroke="#0284c7" stroke-width="2"/><path d="M10 16c0-2.8 2.2-5 5-5h18c2.8 0 5 2.2 5 5v2H10v-2z" fill="#0284c7"/><rect x="15" y="8" width="3" height="6" rx="1.5" fill="#0369a1"/><rect x="30" y="8" width="3" height="6" rx="1.5" fill="#0369a1"/><circle cx="16" cy="23" r="1.5" fill="#94a3b8"/><circle cx="22" cy="23" r="1.5" fill="#94a3b8"/><circle cx="28" cy="23" r="1.5" fill="#94a3b8"/><circle cx="16" cy="28" r="1.5" fill="#94a3b8"/><circle cx="22" cy="28" r="1.5" fill="#94a3b8"/><circle cx="33" cy="33" r="7" fill="#ef4444" stroke="#ffffff" stroke-width="2"/><path d="M33 29v8M29 33h8" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><rect x="10" y="11" width="28" height="26" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="2"/><path d="M10 18h28" stroke="#0284c7" stroke-width="2"/><path d="M10 16c0-2.8 2.2-5 5-5h18c2.8 0 5 2.2 5 5v2H10v-2z" fill="#0284c7"/><rect x="15" y="8" width="3" height="6" rx="1.5" fill="#0369a1"/><rect x="30" y="8" width="3" height="6" rx="1.5" fill="#0369a1"/><circle cx="16" cy="23" r="1.5" fill="#94a3b8"/><circle cx="22" cy="23" r="1.5" fill="#94a3b8"/><circle cx="28" cy="23" r="1.5" fill="#94a3b8"/><circle cx="16" cy="28" r="1.5" fill="#94a3b8"/><circle cx="22" cy="28" r="1.5" fill="#94a3b8"/><circle cx="33" cy="33" r="7" fill="#ef4444" stroke="#ffffff" stroke-width="2"/><path d="M33 29v8M29 33h8" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/></svg>')}`
  },
  {
    key: 'document',
    name: 'Medical Documents',
    category: 'Consultation Guide',
    order: 2,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><path d="M14 9c0-1.1.9-2 2-2h12l10 10v21c0 1.1-.9 2-2 2H16c-1.1 0-2-.9-2-2V9z" fill="#ffffff" stroke="#0284c7" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 7v10h10" stroke="#0284c7" stroke-width="2.2" stroke-linejoin="round" fill="#e0f2fe"/><path d="M20 22h12M20 27h12M20 32h7" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><path d="M14 9c0-1.1.9-2 2-2h12l10 10v21c0 1.1-.9 2-2 2H16c-1.1 0-2-.9-2-2V9z" fill="#ffffff" stroke="#0284c7" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 7v10h10" stroke="#0284c7" stroke-width="2.2" stroke-linejoin="round" fill="#e0f2fe"/><path d="M20 22h12M20 27h12M20 32h7" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round"/></svg>')}`
  },
  {
    key: 'shield',
    name: 'Privacy & Security',
    category: 'Privacy & Safety',
    order: 3,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><path d="M24 8l-13 5v9c0 8.5 5.5 15.5 13 18 7.5-2.5 13-9.5 13-18v-9L24 8z" fill="#ffffff" stroke="#0284c7" stroke-width="2.4" stroke-linejoin="round"/><rect x="18" y="22" width="12" height="9" rx="2" fill="#0284c7"/><path d="M20.5 22v-3.5c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5V22" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="24" cy="26" r="1.2" fill="#ffffff"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><path d="M24 8l-13 5v9c0 8.5 5.5 15.5 13 18 7.5-2.5 13-9.5 13-18v-9L24 8z" fill="#ffffff" stroke="#0284c7" stroke-width="2.4" stroke-linejoin="round"/><rect x="18" y="22" width="12" height="9" rx="2" fill="#0284c7"/><path d="M20.5 22v-3.5c0-1.9 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5V22" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="24" cy="26" r="1.2" fill="#ffffff"/></svg>')}`
  },
  {
    key: 'reschedule',
    name: 'Reschedule & Sync',
    category: 'Rescheduling & Support',
    order: 4,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0fdfa" stroke="#ccfbf1" stroke-width="1.5"/><path d="M34 23c-.6-5.8-5.2-10-11-10-5.5 0-10 3.8-11.2 9" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" fill="none"/><path d="M30 24h5v-5" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M14 25c.6 5.8 5.2 10 11 10 5.5 0 10-3.8 11.2-9" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" fill="none"/><path d="M18 24h-5v5" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0fdfa" stroke="#ccfbf1" stroke-width="1.5"/><path d="M34 23c-.6-5.8-5.2-10-11-10-5.5 0-10 3.8-11.2 9" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" fill="none"/><path d="M30 24h5v-5" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M14 25c.6 5.8 5.2 10 11 10 5.5 0 10-3.8 11.2-9" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" fill="none"/><path d="M18 24h-5v5" stroke="#0d9488" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`
  },
  {
    key: 'insurance',
    name: 'Cashless Mediclaim',
    category: 'Insurance & Mediclaim',
    order: 5,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><rect x="11" y="10" width="24" height="28" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="2.2"/><rect x="18" y="7" width="12" height="5" rx="1.5" fill="#0284c7"/><rect x="22" y="17" width="3" height="8" rx="1" fill="#ef4444"/><rect x="19.5" y="19.5" width="8" height="3" rx="1" fill="#ef4444"/><line x1="16" y1="28" x2="28" y2="28" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="32" x2="24" y2="32" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/><path d="M34 26l-7 3v6.5c0 4 2.8 7.5 7 8.5 4.2-1 7-4.5 7-8.5V29l-7-3z" fill="#10b981" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/><path d="M31.5 35l2 2 4.5-4.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1.5"/><rect x="11" y="10" width="24" height="28" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="2.2"/><rect x="18" y="7" width="12" height="5" rx="1.5" fill="#0284c7"/><rect x="22" y="17" width="3" height="8" rx="1" fill="#ef4444"/><rect x="19.5" y="19.5" width="8" height="3" rx="1" fill="#ef4444"/><line x1="16" y1="28" x2="28" y2="28" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="32" x2="24" y2="32" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/><path d="M34 26l-7 3v6.5c0 4 2.8 7.5 7 8.5 4.2-1 7-4.5 7-8.5V29l-7-3z" fill="#10b981" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/><path d="M31.5 35l2 2 4.5-4.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>')}`
  },
  {
    key: 'credit-card',
    name: '0% EMI & Cashless Card',
    category: 'Payment & Finance',
    order: 6,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#fef3c7" stroke="#fde68a" stroke-width="1.5"/><rect x="9" y="14" width="30" height="20" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="2"/><path d="M9 20h30" stroke="#d97706" stroke-width="2.5"/><rect x="14" y="26" width="6" height="4" rx="1" fill="#f59e0b"/><line x1="24" y1="28" x2="33" y2="28" stroke="#d97706" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#fef3c7" stroke="#fde68a" stroke-width="1.5"/><rect x="9" y="14" width="30" height="20" rx="4" fill="#ffffff" stroke="#d97706" stroke-width="2"/><path d="M9 20h30" stroke="#d97706" stroke-width="2.5"/><rect x="14" y="26" width="6" height="4" rx="1" fill="#f59e0b"/><line x1="24" y1="28" x2="33" y2="28" stroke="#d97706" stroke-width="1.8" stroke-linecap="round"/></svg>')}`
  },
  {
    key: 'emergency',
    name: '24x7 Emergency Desk',
    category: 'Emergency & Trauma',
    order: 7,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#fee2e2" stroke="#fecdd3" stroke-width="1.5"/><circle cx="24" cy="24" r="14" fill="#ffffff" stroke="#ef4444" stroke-width="2"/><path d="M24 16v16M16 24h16" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/><circle cx="34" cy="14" r="2" fill="#ef4444"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#fee2e2" stroke="#fecdd3" stroke-width="1.5"/><circle cx="24" cy="24" r="14" fill="#ffffff" stroke="#ef4444" stroke-width="2"/><path d="M24 16v16M16 24h16" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/><circle cx="34" cy="14" r="2" fill="#ef4444"/></svg>')}`
  },
  {
    key: 'doctor',
    name: 'Doctor & Specialist',
    category: 'Doctors & Consultations',
    order: 8,
    isDefault: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#ede9fe" stroke="#ddd6fe" stroke-width="1.5"/><circle cx="24" cy="18" r="6" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/><path d="M14 36c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M20 28v4a4 4 0 008 0v-4" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
    imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="14" fill="#ede9fe" stroke="#ddd6fe" stroke-width="1.5"/><circle cx="24" cy="18" r="6" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/><path d="M14 36c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M20 28v4a4 4 0 008 0v-4" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" fill="none"/></svg>')}`
  }
];

// Get all FAQ symbols (auto-seeds defaults if empty)
export const getFaqSymbols = async (req, res) => {
  try {
    const count = await FaqSymbol.countDocuments();
    if (count === 0) {
      await FaqSymbol.insertMany(DEFAULT_FAQ_SYMBOLS);
    }
    const symbols = await FaqSymbol.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: symbols });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add custom symbol (Cloudinary URL or SVG data URI)
export const createFaqSymbol = async (req, res) => {
  try {
    const { key, name, category, imageUrl, svg, order } = req.body;
    if (!name || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Name and image URL are required' });
    }

    const uniqueKey = (key || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)) + '-' + Date.now().toString(36);

    const symbol = await FaqSymbol.create({
      key: uniqueKey,
      name: name.trim(),
      category: category || 'General',
      imageUrl: imageUrl.trim(),
      svg: svg || '',
      isDefault: false,
      order: order !== undefined ? Number(order) : 50
    });

    broadcastDbChange('faq_symbols', 'insert', symbol._id, symbol);
    res.status(201).json({ success: true, message: 'FAQ Symbol added successfully', data: symbol });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete custom symbol
export const deleteFaqSymbol = async (req, res) => {
  try {
    const symbol = await FaqSymbol.findById(req.params.id);
    if (!symbol) {
      return res.status(404).json({ success: false, message: 'Symbol not found' });
    }
    const symId = symbol._id;
    await symbol.deleteOne();
    broadcastDbChange('faq_symbols', 'delete', symId);
    res.json({ success: true, message: 'Symbol deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
