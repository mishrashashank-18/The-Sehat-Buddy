import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Content from '../models/Content.js';
import Corporate from '../models/Corporate.js';
import Inquiry from '../models/Inquiry.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { sendEmail } from '../utils/email.js';

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

    const existingContact = await Content.findOne({ type: 'contact' });
    if (!existingContact) {
      const defaultContact = {
        phones: [
          { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 43210', isPrimary: true },
          { id: 'phone-2', label: 'Appointments Desk', number: '+91 80000 12345', isPrimary: false }
        ],
        emails: [
          { id: 'email-1', label: 'Patient Support', email: 'support@thesehatbuddy.com', isPrimary: true },
          { id: 'email-2', label: 'General Inquiries', email: 'contact@thesehatbuddy.com', isPrimary: false }
        ],
        workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM'
      };
      await Content.create({ type: 'contact', data: defaultContact });
      console.log('[Content] Auto-seeded "contact" info into database.');
    }

    const existingLegal = await Content.findOne({ type: 'legal_policies' });
    if (!existingLegal) {
      const defaultLegal = {
        privacyPolicy: {
          url: '',
          fileName: '',
          fileSize: 0,
          fileSizeFormatted: '',
          updatedAt: null
        },
        termsAndConditions: {
          url: '',
          fileName: '',
          fileSize: 0,
          fileSizeFormatted: '',
          updatedAt: null
        }
      };
      await Content.create({ type: 'legal_policies', data: defaultLegal });
      console.log('[Content] Auto-seeded "legal_policies" into database.');
    }
  } catch (err) {
    console.warn('[Content] Auto-seed check warning:', err.message);
  }
};

router.get('/contact', async (req, res) => {
  try {
    let doc = await Content.findOne({ type: 'contact' });
    if (!doc) {
      const defaultContact = {
        phones: [
          { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 43210', isPrimary: true },
          { id: 'phone-2', label: 'Appointments Desk', number: '+91 80000 12345', isPrimary: false }
        ],
        emails: [
          { id: 'email-1', label: 'Patient Support', email: 'support@thesehatbuddy.com', isPrimary: true },
          { id: 'email-2', label: 'General Inquiries', email: 'contact@thesehatbuddy.com', isPrimary: false }
        ],
        workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM'
      };
      doc = await Content.create({ type: 'contact', data: defaultContact });
    }
    return res.json({ success: true, data: doc.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/inquiry', async (req, res) => {
  try {
    const { name, email, phone, category, priority, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const cleanCategory = String(category || 'General Inquiries & Feedback').trim();
    const cleanPriority = String(priority || 'Normal').trim();
    const cleanMessage = String(message).trim();

    // 1. Persist inquiry into MongoDB Atlas collection
    const savedInquiry = await Inquiry.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      category: cleanCategory,
      priority: cleanPriority,
      message: cleanMessage,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || ''
    });

    // 2. Broadcast change for real-time dashboards
    try {
      broadcastDbChange('inquiries', 'create', savedInquiry._id, savedInquiry);
    } catch {}

    // 3. Send email alerts if email provider is configured
    if (process.env.EMAIL_FROM) {
      // Alert administrator
      sendEmail({
        email: process.env.EMAIL_FROM,
        subject: `[Sehat Buddy Inquiry] ${savedInquiry.category} - ${savedInquiry.name}`,
        message: `Name: ${savedInquiry.name}\nEmail: ${savedInquiry.email}\nPhone: ${savedInquiry.phone || 'N/A'}\nPriority: ${savedInquiry.priority}\nCategory: ${savedInquiry.category}\n\nMessage:\n${savedInquiry.message}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 20px;">The Sehat Buddy • New Patient Inquiry</h2>
            </div>
            <p><strong>Inquiry ID:</strong> #${savedInquiry._id}</p>
            <p><strong>Name:</strong> ${savedInquiry.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${savedInquiry.email}">${savedInquiry.email}</a></p>
            <p><strong>Phone:</strong> ${savedInquiry.phone || 'N/A'}</p>
            <p><strong>Category:</strong> ${savedInquiry.category}</p>
            <p><strong>Priority:</strong> <span style="background: ${savedInquiry.priority === 'Urgent' ? '#fee2e2; color: #dc2626' : (savedInquiry.priority === 'Medical Emergency' || savedInquiry.priority === 'Emergency' ? '#fef2f2; color: #991b1b; font-weight: 800' : '#eff6ff; color: #2563eb')}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${savedInquiry.priority}</span></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p><strong>Message:</strong></p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${savedInquiry.message}</div>
          </div>
        `
      }).catch(emailErr => console.warn('Inquiry admin email notice failed:', emailErr.message));

      // Patient confirmation receipt email
      sendEmail({
        email: savedInquiry.email,
        subject: `[The Sehat Buddy] We received your inquiry - ${savedInquiry.category}`,
        message: `Hello ${savedInquiry.name},\n\nThank you for reaching out to The Sehat Buddy. Our healthcare coordination desk has received your inquiry (#${savedInquiry._id}) regarding ${savedInquiry.category}.\n\nOur care coordinators will contact you promptly.\n\nFor emergency medical triage, dial 108 or our 24/7 Helpline: +91 98765 43210.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 20px;">The Sehat Buddy • Care Desk Acknowledgment</h2>
            </div>
            <p>Dear <strong>${savedInquiry.name}</strong>,</p>
            <p>Thank you for contacting The Sehat Buddy. Your healthcare query regarding <strong>${savedInquiry.category}</strong> has been logged with our medical coordination team.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #475569;"><strong>Reference Ticket:</strong> #${savedInquiry._id}</p>
              <p style="margin: 0 0 6px; font-size: 13px; color: #475569;"><strong>Priority:</strong> ${savedInquiry.priority}</p>
              <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Target Category:</strong> ${savedInquiry.category}</p>
            </div>
            <p>An assigned healthcare coordinator will reach out to you directly at <strong>${savedInquiry.phone || savedInquiry.email}</strong>.</p>
            <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 10px 14px; margin-top: 16px; font-size: 13px; color: #1e40af;">
              <strong>Need urgent hospital bed admission?</strong> Call our 24/7 Priority Emergency Desk at <strong>+91 98765 43210</strong>.
            </div>
          </div>
        `
      }).catch(emailErr => console.warn('Inquiry patient receipt notice failed:', emailErr.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our healthcare care team will respond shortly.',
      data: savedInquiry
    });
  } catch (err) {
    console.error('Failed to save inquiry:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error while processing inquiry' });
  }
});

/**
 * Admin endpoints to view and manage inquiries
 */
router.get('/inquiries', checkAdminAuth, async (req, res) => {
  try {
    const { status, category, limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 100);

    return res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/inquiries/:id', checkAdminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const update = { updatedAt: new Date() };
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (status === 'Resolved' || status === 'Contacted') update.respondedAt = new Date();

    const updated = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    broadcastDbChange('inquiries', 'update', updated._id, updated);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/inquiries/:id', checkAdminAuth, async (req, res) => {
  try {
    const deleted = await Inquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    broadcastDbChange('inquiries', 'delete', req.params.id, null);
    return res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/legal-policies', async (req, res) => {
  try {
    let doc = await Content.findOne({ type: 'legal_policies' });
    if (!doc) {
      const defaultLegal = {
        privacyPolicy: {
          url: '',
          fileName: '',
          fileSize: 0,
          fileSizeFormatted: '',
          updatedAt: null
        },
        termsAndConditions: {
          url: '',
          fileName: '',
          fileSize: 0,
          fileSizeFormatted: '',
          updatedAt: null
        }
      };
      doc = await Content.create({ type: 'legal_policies', data: defaultLegal });
    }
    return res.json({ success: true, data: doc.data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Stream/View policy PDF inline in browser with strict inline headers
 * Prevents forced file download on client machines
 */
router.get('/view-document/:type', async (req, res) => {
  try {
    const rawType = (req.params.type || '').toLowerCase();
    const isPrivacy = rawType === 'privacy' || rawType === 'privacypolicy';
    const isTerms = rawType === 'terms' || rawType === 'termsandconditions';

    if (!isPrivacy && !isTerms) {
      return res.status(400).json({ success: false, message: 'Invalid document type. Must be "privacy" or "terms".' });
    }

    const doc = await Content.findOne({ type: 'legal_policies' });
    const policyKey = isPrivacy ? 'privacyPolicy' : 'termsAndConditions';
    const policyData = doc?.data?.[policyKey];

    if (!policyData || !policyData.url) {
      return res.status(404).json({ success: false, message: 'No custom PDF has been uploaded for this document.' });
    }

    const docUrl = policyData.url;

    // 1. If local file stored in uploads
    if (docUrl.startsWith('/uploads/') || docUrl.startsWith('uploads/')) {
      const cleanRel = docUrl.replace(/^\/?uploads\//, '');
      const absPath = path.resolve(__dirname, '../uploads', cleanRel);
      if (fs.existsSync(absPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + (policyData.fileName || 'policy.pdf') + '"');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.sendFile(absPath);
      }
    }

    // 2. If Cloudinary or external URL
    return res.redirect(docUrl);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

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
            logo: item.logo || '',
            website: item.website || '',
            order: idx + 1
          }));
          await Corporate.insertMany(docs);
        }
        broadcastDbChange('corporates', 'update', 'all', finalData);
      } catch (cErr) {
        console.warn('Corporate sync warning in contentRoutes:', cErr.message);
      }
    } else {
      broadcastDbChange('contents', 'update', content._id, { type, data: finalData });
    }
    res.json({ success: true, data: content, message: `${type} updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
