import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';

export const authAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    const admin = await Admin.create({ name, email, password });
    if (admin) {
      res.status(201).json({
        success: true,
        token: generateToken(admin._id),
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

// Added logging
