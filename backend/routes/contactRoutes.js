import express from 'express';
import Contact from '../models/Contact.js';
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

export const DEFAULT_CONTACT_DATA = {
  topBadge: 'Verified Healthcare Concierge',
  statusBadge: '24/7 Live Patient Support Active',
  title: "We're Here for You & Your Family",
  subtitle: "Reach our care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.",
  helplineLabel: 'Helpline & Emergency',
  helplineStatus: '24x7 Active',
  helphoneNumber: '+91 98765 4321',
  helplineNumber: '+91 98765 4321',
  helplineDesc: 'Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.',
  image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
  imagePublicId: null,
  photoBadge: '40+ Network Hospitals • Bengaluru Care Hub',
  phones: [
    { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 4321', isPrimary: true }
  ],
  emails: [
    { id: 'email-1', label: 'Patient Support & Inquiries', email: 'contactus@thesehatbuddy.com', isPrimary: true }
  ],
  workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM'
};

/**
 * Gets or seeds the Contact document in the `contacts` collection
 * and ensures `contents` collection ({ type: 'contact' }) stays synchronized.
 */
export const getOrSeedContact = async () => {
  let contact = await Contact.findOne({});
  let contentContact = await Content.findOne({ type: 'contact' });

  if (!contact && contentContact && contentContact.data) {
    contact = await Contact.create(contentContact.data);
  } else if (!contact) {
    contact = await Contact.create(DEFAULT_CONTACT_DATA);
  }

  // Ensure Content ({ type: 'contact' }) is in sync
  const contactObj = contact.toObject ? contact.toObject() : contact;
  if (!contentContact || !contentContact.data) {
    await Content.findOneAndUpdate(
      { type: 'contact' },
      { data: contactObj },
      { upsert: true, new: true }
    );
  }

  return contact;
};

// GET /api/contact - Real-time fetch from MongoDB Atlas `contacts` collection
router.get('/', async (req, res) => {
  try {
    const contact = await getOrSeedContact();
    res.json({ success: true, data: contact });
  } catch (err) {
    console.error('Error fetching contact information:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/contact - Update contact us information in MongoDB Atlas and clean Cloudinary
router.put('/', checkAdminAuth, async (req, res) => {
  try {
    const incoming = req.body;
    let existing = await Contact.findOne({});
    if (!existing) {
      existing = await getOrSeedContact();
    }

    const oldImage = existing?.image;
    const newImage = incoming.image;

    // Permanently destroy old image from Cloudinary if removed or replaced
    if (oldImage && (oldImage.includes('cloudinary.com') || oldImage.includes('res.cloudinary.com')) && (newImage === '' || (newImage && newImage !== oldImage))) {
      const pubId = existing.imagePublicId || extractCloudinaryPublicId(oldImage);
      if (pubId) {
        try {
          const cld = getCloudinary();
          await cld.uploader.destroy(pubId, { resource_type: 'image', invalidate: true });
        } catch (cldErr) {
          console.warn('Cloudinary contact photo destroy warning:', cldErr.message);
        }
      }
    }

    const updatedContact = await Contact.findOneAndUpdate(
      {},
      { $set: incoming },
      { new: true, upsert: true }
    );

    const dataObj = updatedContact.toObject ? updatedContact.toObject() : updatedContact;

    // Keep Content ({ type: 'contact' }) synchronized in MongoDB
    await Content.findOneAndUpdate(
      { type: 'contact' },
      { data: dataObj },
      { new: true, upsert: true }
    );

    // Broadcast real-time change to all connected clients
    broadcastDbChange('contacts', 'update', updatedContact._id, dataObj);
    broadcastDbChange('contents', 'update', 'contact', { type: 'contact', data: dataObj });

    res.json({ success: true, data: dataObj, message: 'Contact info updated in MongoDB Atlas successfully' });
  } catch (err) {
    console.error('Error updating contact information:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/contact/image - Explicitly delete contact showcase photo from Cloudinary & MongoDB
router.delete('/image', checkAdminAuth, async (req, res) => {
  try {
    const contact = await Contact.findOne({});
    if (!contact || !contact.image) {
      return res.json({ success: true, message: 'No photo to delete' });
    }

    const curImage = contact.image;
    if (curImage.includes('cloudinary.com') || curImage.includes('res.cloudinary.com')) {
      const pubId = contact.imagePublicId || extractCloudinaryPublicId(curImage);
      if (pubId) {
        try {
          const cld = getCloudinary();
          await cld.uploader.destroy(pubId, { resource_type: 'image', invalidate: true });
        } catch (cldErr) {
          console.warn('Failed to delete photo from Cloudinary:', cldErr.message);
        }
      }
    }

    contact.image = '';
    contact.imagePublicId = null;
    await contact.save();

    const dataObj = contact.toObject();
    await Content.findOneAndUpdate(
      { type: 'contact' },
      { data: dataObj },
      { new: true }
    );

    broadcastDbChange('contacts', 'update', contact._id, dataObj);
    broadcastDbChange('contents', 'update', 'contact', { type: 'contact', data: dataObj });

    res.json({ success: true, data: dataObj, message: 'Showcase photo deleted from Cloudinary and MongoDB Atlas' });
  } catch (err) {
    console.error('Error deleting contact photo:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
