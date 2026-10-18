import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';
import validatePassword from '../utils/validatePassword.js';
import { cloudinary } from '../config/cloudinary.js';

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
        admin.failedLoginAttempts = 0;
        admin.lockUntil = undefined;
        await admin.save();
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
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        admin.failedLoginAttempts = 0;
        await admin.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      await admin.save();
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
      rating: rating || 4.8, reviews: reviews || '50+', hospital, qualifications, contact_number, available: available !== undefined ? available : true
    });
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
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      doctor = await Doctor.findById(req.params.id);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: req.params.id });
    }
    if (doctor) {
      Object.assign(doctor, req.body);

      if (req.body.isStarDoctor !== undefined) {
        doctor.isStarDoctor = Boolean(req.body.isStarDoctor);
        doctor.markModified('isStarDoctor');
      }

      if (req.body.awards !== undefined) {
        doctor.awards = Array.isArray(req.body.awards) ? req.body.awards : [];
        doctor.markModified('awards');
      }
      if (req.body.certifications !== undefined) {
        doctor.certifications = Array.isArray(req.body.certifications) ? req.body.certifications : [];
        doctor.markModified('certifications');
      }
      if (req.body.memberships !== undefined) {
        doctor.memberships = Array.isArray(req.body.memberships) ? req.body.memberships : [];
        doctor.markModified('memberships');
      }
      if (req.body.careerExperience !== undefined) {
        doctor.careerExperience = Array.isArray(req.body.careerExperience) ? req.body.careerExperience : [];
        doctor.markModified('careerExperience');
      }
      if (req.body.licenseNumber !== undefined) {
        doctor.licenseNumber = req.body.licenseNumber;
      }

      if (req.body.reels !== undefined) {
        doctor.reels = req.body.reels;
        doctor.markModified('reels');
      }
      if (req.body.youtube_videos !== undefined) {
        doctor.youtube_videos = req.body.youtube_videos;
        doctor.markModified('youtube_videos');
      }
      if (req.body.instagram !== undefined) doctor.instagram = req.body.instagram;
      if (req.body.facebook !== undefined) doctor.facebook = req.body.facebook;
      if (req.body.faqs !== undefined) {
        doctor.faqs = Array.isArray(req.body.faqs) ? req.body.faqs : [];
        doctor.markModified('faqs');
      }
      
      if (req.file) {
        doctor.image = req.file.path;
      } else if (req.body.image) {
        doctor.image = req.body.image;
      }
      const updatedDoctor = await doctor.save();
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
      await doctor.deleteOne();
      res.json({ success: true, message: 'Doctor deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStorageStats = async (req, res) => {
  try {
    let mongoStats = null;
    let cloudinaryStats = null;

    // 1. MongoDB Atlas Storage Stats
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const stats = await mongoose.connection.db.stats();
        // Atlas M0 Free Tier limit is 512 MB, allow custom env override
        const totalLimitMB = Number(process.env.MONGODB_STORAGE_LIMIT_MB) || 512;
        const totalLimitBytes = totalLimitMB * 1024 * 1024;
        
        // MongoDB Atlas calculates total storage used as storageSize + indexSize
        const usedBytes = (stats.storageSize || 0) + (stats.indexSize || 0);
        const remainingBytes = Math.max(0, totalLimitBytes - usedBytes);
        const percentUsed = Number(Math.min(100, (usedBytes / totalLimitBytes) * 100).toFixed(2));
        
        mongoStats = {
          databaseName: stats.db || 'thesehatbuddy',
          totalLimitBytes,
          totalLimitMB,
          usedBytes,
          usedMB: Number((usedBytes / (1024 * 1024)).toFixed(2)),
          remainingBytes,
          remainingMB: Number((remainingBytes / (1024 * 1024)).toFixed(2)),
          percentUsed,
          dataSizeBytes: stats.dataSize || 0,
          dataSizeMB: Number(((stats.dataSize || 0) / (1024 * 1024)).toFixed(2)),
          storageSizeBytes: stats.storageSize || 0,
          storageSizeMB: Number(((stats.storageSize || 0) / (1024 * 1024)).toFixed(2)),
          indexSizeBytes: stats.indexSize || 0,
          indexSizeMB: Number(((stats.indexSize || 0) / (1024 * 1024)).toFixed(2)),
          collections: stats.collections || 0,
          objects: stats.objects || 0,
          status: percentUsed >= 90 ? 'critical' : percentUsed >= 75 ? 'warning' : 'healthy'
        };
      }
    } catch (mongoErr) {
      console.error('Error fetching MongoDB stats:', mongoErr.message);
      mongoStats = {
        error: mongoErr.message,
        status: 'error'
      };
    }

    // 2. Cloudinary Media Storage Stats
    try {
      if (cloudinary && cloudinary.api && cloudinary.api.usage) {
        const usage = await cloudinary.api.usage();
        const plan = usage.plan || 'Free';
        const creditsLimit = usage.credits?.limit || 25;
        const creditsUsed = usage.credits?.usage || 0;
        const creditsRemaining = Math.max(0, Number((creditsLimit - creditsUsed).toFixed(2)));
        const creditsPercentUsed = usage.credits?.used_percent ?? Number(((creditsUsed / creditsLimit) * 100).toFixed(2));

        // 1 Credit = 1 GB of storage or bandwidth
        const totalStorageBytes = creditsLimit * 1024 * 1024 * 1024;
        const totalStorageGB = creditsLimit;
        const usedStorageBytes = usage.storage?.usage || 0;
        const usedStorageMB = Number((usedStorageBytes / (1024 * 1024)).toFixed(2));
        const usedStorageGB = Number((usedStorageBytes / (1024 * 1024 * 1024)).toFixed(3));
        const remainingStorageBytes = Math.max(0, totalStorageBytes - usedStorageBytes);
        const remainingStorageGB = Number((remainingStorageBytes / (1024 * 1024 * 1024)).toFixed(2));
        const storagePercentUsed = Number(((usedStorageBytes / totalStorageBytes) * 100).toFixed(2));

        cloudinaryStats = {
          plan,
          lastUpdated: usage.last_updated || new Date().toISOString(),
          totalLimitBytes: totalStorageBytes,
          totalLimitGB: totalStorageGB,
          usedBytes: usedStorageBytes,
          usedMB: usedStorageMB,
          usedGB: usedStorageGB,
          remainingBytes: remainingStorageBytes,
          remainingGB: remainingStorageGB,
          percentUsed: storagePercentUsed,
          credits: {
            total: creditsLimit,
            used: creditsUsed,
            remaining: creditsRemaining,
            percentUsed: creditsPercentUsed
          },
          objects: usage.objects?.usage ?? usage.resources ?? 0,
          bandwidthBytes: usage.bandwidth?.usage || 0,
          bandwidthMB: Number(((usage.bandwidth?.usage || 0) / (1024 * 1024)).toFixed(2)),
          transformations: usage.transformations?.usage || 0,
          status: creditsPercentUsed >= 90 ? 'critical' : creditsPercentUsed >= 75 ? 'warning' : 'healthy'
        };
      }
    } catch (cldErr) {
      console.error('Error fetching Cloudinary stats:', cldErr.message);
      cloudinaryStats = {
        error: cldErr.message,
        status: 'error'
      };
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      mongodb: mongoStats,
      cloudinary: cloudinaryStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
