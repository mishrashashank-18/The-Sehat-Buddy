import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';
import validatePassword from '../utils/validatePassword.js';
import { cloudinary } from '../config/cloudinary.js';
import EmailLog from '../models/EmailLog.js';
import { calculateStorageStats, streamStorageStats, broadcastDbChange } from '../services/storageMonitor.js';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';

export const authAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: (email || '').toLowerCase().trim() }).select('+password +failedLoginAttempts +lockUntil');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Account lockout verification
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((admin.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    if (await admin.matchPassword(password)) {
      if (admin.failedLoginAttempts > 0 || admin.lockUntil) {
        Admin.updateOne({ _id: admin._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }).catch(() => {});
      }

      return res.json({
        success: true,
        token: generateToken(admin._id, 'admin', admin.tokenVersion || 0),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    } else {
      admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
      if (admin.failedLoginAttempts >= 5) {
        Admin.updateOne({ _id: admin._id }, { $set: { lockUntil: new Date(Date.now() + 15 * 60 * 1000), failedLoginAttempts: 0 } }).catch(() => {});
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      Admin.updateOne({ _id: admin._id }, { $set: { failedLoginAttempts: admin.failedLoginAttempts } }).catch(() => {});
      const remainingAttempts = Math.max(0, 5 - admin.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remainingAttempts} attempt(s) remaining before temporary lockout.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const existingAdminsCount = await Admin.countDocuments();
    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    const envSecret = process.env.ADMIN_REGISTRATION_SECRET;

    // If an admin already exists in the system, registration requires an existing admin session OR valid secret
    if (existingAdminsCount > 0) {
      const hasValidSecret = envSecret && adminSecret && adminSecret === envSecret;
      const isAuthedAdmin = req.user && req.user.role === 'admin';
      if (!hasValidSecret && !isAuthedAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin registration is restricted. Initial platform setup has already been completed.'
        });
      }
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    const admin = await Admin.create({ name, email, password, role: 'admin' });
    if (admin) {
      res.status(201).json({
        success: true,
        token: generateToken(admin._id, 'admin'),
        message: 'Admin account created successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience, about, fees, address, reels, youtube_videos, instagram, facebook, rating, reviews, hospital, qualifications, contact_number, available } = req.body;
    let image = req.body.image || '';
    if (req.file) {
      image = req.file.path;
    }
    
    let parsedAddress = {};
    if (address) {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    }

    const doctor = await Doctor.create({
      name, email, password: password || 'password123', specialization, experience, about, fees, address: parsedAddress, image, reels: reels || [], youtube_videos: youtube_videos || [], instagram, facebook,
      rating: rating !== undefined && !isNaN(Number(rating)) ? Number(rating) : 0, reviews: reviews !== undefined ? String(reviews) : '0', hospital, qualifications, contact_number, available: available !== undefined ? available : true
    });
    broadcastDbChange('doctors', 'insert', doctor._id, doctor);
    res.status(201).json({ success: true, message: 'Doctor added', data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select('-password');
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const doctorsCount = await Doctor.countDocuments();
    const hospitalsCount = await Hospital.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();
    res.json({
      success: true,
      data: {
        doctors: doctorsCount,
        hospitals: hospitalsCount,
        appointments: appointmentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    let doctor = null;
    const reqId = String(req.params.id).trim();
    if (mongoose.Types.ObjectId.isValid(reqId)) {
      doctor = await Doctor.findById(reqId);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: reqId });
    }
    if (!doctor && (reqId === '1' || reqId === 'default')) {
      doctor = await Doctor.findOne({ email: 'dr.rahul@sehatbuddy.com' }) || await Doctor.findOne({});
    }
    if (!doctor && req.body.email) {
      doctor = await Doctor.findOne({ email: String(req.body.email).toLowerCase().trim() });
    }
    if (!doctor && reqId.includes('@')) {
      doctor = await Doctor.findOne({ email: reqId.toLowerCase() });
    }
    if (doctor) {
      Object.assign(doctor, req.body);

      if (!doctor.id && reqId) {
        doctor.id = reqId;
        doctor.markModified('id');
      }

      if (req.body.name !== undefined) {
        doctor.name = String(req.body.name).trim();
        doctor.markModified('name');
      }

      if (req.body.specialty !== undefined || req.body.specialization !== undefined) {
        const spec = req.body.specialty || req.body.specialization;
        doctor.specialty = spec;
        doctor.specialization = spec;
        doctor.markModified('specialty');
        doctor.markModified('specialization');
      }

      if (req.body.hospital !== undefined) {
        doctor.hospital = req.body.hospital;
        doctor.markModified('hospital');
      }

      if (req.body.degree !== undefined || req.body.qualifications !== undefined) {
        const deg = req.body.degree || req.body.qualifications;
        doctor.degree = deg;
        doctor.qualifications = deg;
        doctor.markModified('degree');
        doctor.markModified('qualifications');
      }

      if (req.body.experience !== undefined || req.body.experienceYears !== undefined) {
        const expNum = parseInt(req.body.experience ?? req.body.experienceYears, 10);
        doctor.experience = !isNaN(expNum) ? expNum : (doctor.experience || 5);
        doctor.markModified('experience');
      }

      if (req.body.rating !== undefined) {
        const rNum = parseFloat(req.body.rating);
        doctor.rating = !isNaN(rNum) ? rNum : 0;
        doctor.markModified('rating');
      }

      if (req.body.reviews !== undefined) {
        doctor.reviews = String(req.body.reviews).trim();
        doctor.markModified('reviews');
      }

      if (req.body.available !== undefined) {
        doctor.available = Boolean(req.body.available);
        doctor.markModified('available');
      }

      if (req.body.availabilityStatus !== undefined) {
        doctor.availabilityStatus = req.body.availabilityStatus;
        doctor.markModified('availabilityStatus');
      }

      if (req.body.fees !== undefined || req.body.price !== undefined) {
        const feesNum = Number(req.body.fees ?? req.body.price);
        doctor.fees = !isNaN(feesNum) ? feesNum : (doctor.fees || 500);
        doctor.price = doctor.fees;
        doctor.markModified('fees');
        doctor.markModified('price');
      }

      if (req.body.isStarDoctor !== undefined) {
        doctor.isStarDoctor = Boolean(req.body.isStarDoctor);
        doctor.markModified('isStarDoctor');
      }

      if (req.body.awards !== undefined) {
        doctor.awards = Array.isArray(req.body.awards) ? req.body.awards.filter(Boolean) : [];
        doctor.markModified('awards');
      }
      if (req.body.certifications !== undefined) {
        doctor.certifications = Array.isArray(req.body.certifications) ? req.body.certifications.filter(Boolean) : [];
        doctor.markModified('certifications');
      }
      if (req.body.memberships !== undefined) {
        doctor.memberships = Array.isArray(req.body.memberships) ? req.body.memberships.filter(Boolean) : [];
        doctor.markModified('memberships');
      }
      if (req.body.careerExperience !== undefined) {
        doctor.careerExperience = Array.isArray(req.body.careerExperience) ? req.body.careerExperience.filter(Boolean) : [];
        doctor.markModified('careerExperience');
      }
      if (req.body.tags !== undefined) {
        doctor.tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [];
        doctor.markModified('tags');
      }
      if (req.body.licenseNumber !== undefined) {
        doctor.licenseNumber = req.body.licenseNumber;
        doctor.markModified('licenseNumber');
      }
      if (req.body.availableDays !== undefined) {
        doctor.availableDays = req.body.availableDays;
        doctor.markModified('availableDays');
      }
      if (req.body.scheduleDays !== undefined) {
        doctor.scheduleDays = Array.isArray(req.body.scheduleDays) ? req.body.scheduleDays.filter(Boolean) : [];
        doctor.markModified('scheduleDays');
      }
      if (req.body.availableSlots !== undefined) {
        doctor.availableSlots = Array.isArray(req.body.availableSlots) ? req.body.availableSlots.filter(Boolean) : [];
        doctor.markModified('availableSlots');
      }
      if (req.body.slotDuration !== undefined) {
        const durNum = Number(req.body.slotDuration);
        doctor.slotDuration = !isNaN(durNum) ? durNum : (doctor.slotDuration || 20);
        doctor.markModified('slotDuration');
      }
      if (req.body.slots_booked !== undefined) {
        doctor.slots_booked = typeof req.body.slots_booked === 'object' && req.body.slots_booked !== null ? req.body.slots_booked : {};
        doctor.markModified('slots_booked');
      }
      if (req.body.dayWiseSlots !== undefined) {
        doctor.dayWiseSlots = typeof req.body.dayWiseSlots === 'object' && req.body.dayWiseSlots !== null ? req.body.dayWiseSlots : {};
        doctor.markModified('dayWiseSlots');
      }
      if (req.body.dateWiseSlots !== undefined) {
        doctor.dateWiseSlots = typeof req.body.dateWiseSlots === 'object' && req.body.dateWiseSlots !== null ? req.body.dateWiseSlots : {};
        doctor.markModified('dateWiseSlots');
      }

      if (req.body.reels !== undefined) {
        doctor.reels = Array.isArray(req.body.reels)
          ? req.body.reels.map(r => {
              if (typeof r === 'string') return r.trim();
              if (r && typeof r === 'object') return r;
              return '';
            }).filter(Boolean)
          : [];
        doctor.markModified('reels');
      }
      if (req.body.youtube_videos !== undefined) {
        doctor.youtube_videos = Array.isArray(req.body.youtube_videos)
          ? req.body.youtube_videos.map(v => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
          : [];
        doctor.markModified('youtube_videos');
      }
      if (req.body.instagram !== undefined) doctor.instagram = req.body.instagram;
      if (req.body.facebook !== undefined) doctor.facebook = req.body.facebook;
      if (req.body.faqs !== undefined) {
        doctor.faqs = Array.isArray(req.body.faqs) ? req.body.faqs : [];
        doctor.markModified('faqs');
      }
      
      const incomingImage = req.file ? req.file.path : req.body.image;
      if (incomingImage && incomingImage !== doctor.image) {
        if (doctor.image && typeof doctor.image === 'string' && doctor.image.includes('cloudinary.com')) {
          const oldPublicId = extractCloudinaryPublicId(doctor.image);
          if (oldPublicId) {
            try {
              const cld = getCloudinary();
              await cld.uploader.destroy(oldPublicId, { resource_type: 'image', invalidate: true });
            } catch (cldErr) {
              console.warn('Failed to delete old doctor photo from Cloudinary:', cldErr.message);
            }
          }
        }
        doctor.image = incomingImage;
      }
      const updatedDoctor = await doctor.save();
      broadcastDbChange('doctors', 'update', updatedDoctor._id, updatedDoctor);
      res.json({ success: true, message: 'Doctor updated', data: updatedDoctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
      const docId = doctor._id;
      // Permanently remove doctor image from Cloudinary
      if (doctor.image && typeof doctor.image === 'string' && doctor.image.includes('cloudinary.com')) {
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
      await doctor.deleteOne();
      broadcastDbChange('doctors', 'delete', docId);
      res.json({ success: true, message: 'Doctor deleted permanently' });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStorageStats = async (req, res) => {
  try {
    const stats = await calculateStorageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1, date: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, cancelled, isCompleted } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (status !== undefined) {
      appointment.status = status;
      if (status === 'Completed') {
        appointment.isCompleted = true;
      } else if (status === 'Cancelled') {
        appointment.cancelled = true;
      }
    }
    if (cancelled !== undefined) appointment.cancelled = Boolean(cancelled);
    if (isCompleted !== undefined) appointment.isCompleted = Boolean(isCompleted);
    await appointment.save();

    try {
      broadcastDbChange('appointments', 'update', appointment._id.toString(), appointment);
    } catch {}

    res.json({ success: true, message: 'Appointment status updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    try {
      broadcastDbChange('appointments', 'delete', req.params.id);
    } catch {}

    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { streamStorageStats };
