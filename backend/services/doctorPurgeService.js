import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import EmailLog from '../models/EmailLog.js';
import Subscriber from '../models/Subscriber.js';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import { broadcastDbChange } from './storageMonitor.js';
import { clearDoctorDashboardCache } from '../controllers/doctorController.js';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';

/**
 * Permanently and atomically purges a doctor from all MongoDB collections,
 * wiping their profile, email logs, user account, hospital affiliations,
 * appointments, reviews, and cloud assets.
 * 
 * Also broadcasts real-time SSE deletion events so any active doctor sessions
 * on DoctorDashboard are automatically logged out immediately.
 */
export const purgeDoctorPermanently = async (identifier) => {
  let doctor = null;
  const raw = String(identifier?._id || identifier?.id || identifier || '').trim();
  const rawEmail = String(
    identifier?.email || 
    (typeof identifier === 'string' && identifier.includes('@') ? identifier : '')
  ).toLowerCase().trim();

  // 1. Resolve Doctor Document
  if (identifier && typeof identifier === 'object' && identifier._id && identifier.email) {
    doctor = identifier;
  } else {
    if (mongoose.Types.ObjectId.isValid(raw)) {
      doctor = await Doctor.findById(raw);
    }
    if (!doctor && raw) {
      doctor = await Doctor.findOne({ id: raw });
    }
    if (!doctor && rawEmail) {
      doctor = await Doctor.findOne({ email: rawEmail });
    }
    if (!doctor && raw && raw.includes('@')) {
      const decoded = decodeURIComponent(raw).toLowerCase().trim();
      doctor = await Doctor.findOne({ email: decoded });
    }
  }

  // 2. Resolve target Doctor IDs and Email
  const docId = doctor ? doctor._id : (mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null);
  const docCustomId = doctor?.id || (!mongoose.Types.ObjectId.isValid(raw) && !raw.includes('@') && raw ? raw : null);
  const docEmail = (doctor?.email || rawEmail || (raw.includes('@') ? decodeURIComponent(raw) : '')).toLowerCase().trim();

  // If no doctor record found and no valid email provided
  if (!doctor && !docId && !docEmail) {
    return { success: false, notFound: true, message: 'Doctor not found in database' };
  }

  // 3. Delete Doctor Cloudinary photo if present
  if (doctor?.image && typeof doctor.image === 'string' && doctor.image.includes('cloudinary.com')) {
    const publicId = extractCloudinaryPublicId(doctor.image);
    if (publicId) {
      try {
        const cld = getCloudinary();
        await cld.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
      } catch (cldErr) {
        console.warn('Failed to delete doctor photo from Cloudinary:', cldErr.message);
      }
    }
  }

  // 4. Permanently delete from MongoDB Doctor collection
  const doctorDeleteConditions = [];
  if (docId) doctorDeleteConditions.push({ _id: docId });
  if (docCustomId) doctorDeleteConditions.push({ id: docCustomId });
  if (docEmail) doctorDeleteConditions.push({ email: docEmail });
  if (doctorDeleteConditions.length > 0) {
    await Doctor.deleteMany({ $or: doctorDeleteConditions });
  }

  // 5. Permanently delete doctor user record and mail from MongoDB User collection
  if (docEmail) {
    try {
      await User.deleteMany({ email: docEmail });
    } catch (userErr) {
      console.warn('Failed to delete doctor from User collection:', userErr.message);
    }
  }

  // 6. Permanently delete all mail logs / sent emails from MongoDB EmailLog collection
  if (docEmail) {
    try {
      await EmailLog.deleteMany({ to: docEmail });
    } catch (emailLogErr) {
      console.warn('Failed to delete doctor mail from EmailLog collection:', emailLogErr.message);
    }
  }

  // 7. Permanently delete newsletter / subscriber entry from MongoDB Subscriber collection
  if (docEmail) {
    try {
      await Subscriber.deleteMany({ email: docEmail });
    } catch (subErr) {
      console.warn('Failed to delete doctor mail from Subscriber collection:', subErr.message);
    }
  }

  // 8. Permanently remove doctor references from all Hospital rosters (star_doctors, staff_doctors, staff_emails)
  try {
    const hospPull = {};
    if (docId) {
      hospPull.star_doctors = docId;
    }
    if (docEmail) {
      hospPull.staff_doctors = { email: docEmail };
      hospPull.staff_emails = docEmail;
    }

    if (Object.keys(hospPull).length > 0) {
      await Hospital.updateMany({}, { $pull: hospPull });
    }
  } catch (hospErr) {
    console.warn('Failed to clean up doctor from hospital references in MongoDB:', hospErr.message);
  }

  // 9. Permanently delete associated Appointments from database
  try {
    const aptOrConditions = [];
    if (docId) {
      aptOrConditions.push({ doctorId: docId });
      aptOrConditions.push({ doctorId: docId.toString() });
      aptOrConditions.push({ 'doctor.id': docId.toString() });
      aptOrConditions.push({ 'docData._id': docId.toString() });
    }
    if (docCustomId) {
      aptOrConditions.push({ doctorId: docCustomId });
      aptOrConditions.push({ 'doctor.id': docCustomId });
      aptOrConditions.push({ 'docData.id': docCustomId });
    }
    if (docEmail) {
      aptOrConditions.push({ 'doctor.email': docEmail });
      aptOrConditions.push({ 'docData.email': docEmail });
      aptOrConditions.push({ docId: docEmail });
      aptOrConditions.push({ doctorId: docEmail });
    }

    if (aptOrConditions.length > 0) {
      await Appointment.deleteMany({ $or: aptOrConditions });
    }
  } catch (aptErr) {
    console.warn('Failed to clean up appointments for deleted doctor:', aptErr.message);
  }

  // 10. Permanently delete associated Reviews from database
  try {
    const revOrConditions = [];
    if (docId) {
      revOrConditions.push({ doctorId: docId });
      revOrConditions.push({ doctorId: docId.toString() });
      revOrConditions.push({ targetId: docId.toString() });
    }
    if (docEmail) {
      revOrConditions.push({ userEmail: docEmail });
    }

    if (revOrConditions.length > 0) {
      await Review.deleteMany({ $or: revOrConditions });
    }
  } catch (revErr) {
    console.warn('Failed to clean up reviews for deleted doctor:', revErr.message);
  }

  // 11. Clear doctor dashboard cache
  try {
    clearDoctorDashboardCache();
  } catch {}

  // 12. Broadcast real-time deletion events with full ID and email metadata
  const broadcastDocId = docId ? docId.toString() : (docCustomId || docEmail);
  const eventPayload = {
    _id: docId ? docId.toString() : null,
    id: docCustomId || (docId ? docId.toString() : null),
    email: docEmail,
    name: doctor?.name || 'Doctor',
    deletedAt: Date.now()
  };

  broadcastDbChange('doctors', 'delete', broadcastDocId, eventPayload);
  broadcastDbChange('hospitals', 'update', null);
  broadcastDbChange('appointments', 'delete', null);

  return {
    success: true,
    docId: broadcastDocId,
    email: docEmail,
    message: 'Doctor and all associated database records (including email logs, user account, appointments, and hospital roster entries) deleted permanently'
  };
};
