import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';

export const authDoctor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (doctor && (await doctor.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(doctor._id),
        user: doctor
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check if doctor email exists and determine if it's their first login
 */
export const checkDoctorEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No registered doctor account found with this email. Please contact your hospital administrator.'
      });
    }

    const isFirstLogin = Boolean(doctor.isFirstLogin || !doctor.passwordSet || doctor.password === 'CHANGEME_PENDING_SETUP');

    return res.json({
      success: true,
      exists: true,
      isFirstLogin,
      name: doctor.name,
      email: doctor.email,
      hospital: doctor.hospital
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Set password for first-time doctor login
 */
export const setInitialPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    doctor.password = password;
    doctor.isFirstLogin = false;
    doctor.passwordSet = true;
    await doctor.save();

    return res.json({
      success: true,
      message: 'Password set successfully! Logging in...',
      token: generateToken(doctor._id),
      user: doctor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor requested OTP for password reset
 */
export const forgotDoctorPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No registered doctor account found with this email. Please check your email or contact your hospital administrator.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    doctor.otp = otp;
    doctor.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await doctor.save();

    try {
      await sendEmail({
        email: doctor.email,
        subject: 'Password Reset OTP - Sehat Buddy Doctor Portal',
        message: `Hello ${doctor.name},\n\nYour OTP for resetting your doctor account password is ${otp}. It is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 520px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 20px;">Sehat Buddy • Doctor Portal</h2>
            </div>
            <p style="font-size: 15px;">Hello <strong>${doctor.name}</strong>,</p>
            <p style="font-size: 14px; color: #475569;">You requested to reset your password. Use the 6-digit OTP below to verify your identity and set a new password:</p>
            <div style="text-align: center; margin: 24px 0;">
              <div style="background: #eff6ff; border: 1px dashed #3b82f6; padding: 14px 28px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; border-radius: 10px; display: inline-block;">
                ${otp}
              </div>
            </div>
            <p style="font-size: 13px; color: #64748b;">⏱️ This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, please safely ignore this email.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending doctor password reset OTP email:', emailErr.message);
    }

    console.log(`[DOCTOR RESET OTP] OTP for ${doctor.email} is: ${otp}`);

    return res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${doctor.email}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify doctor reset OTP
 */
export const verifyDoctorResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    if (!doctor.otp || doctor.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    if (doctor.otpExpires && new Date(doctor.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset doctor password with OTP
 */
export const resetDoctorPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    if (!doctor.otp || doctor.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    if (doctor.otpExpires && new Date(doctor.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    doctor.password = password;
    doctor.isFirstLogin = false;
    doctor.passwordSet = true;
    doctor.otp = undefined;
    doctor.otpExpires = undefined;
    await doctor.save();

    return res.json({
      success: true,
      message: 'Password reset successfully! Logging in...',
      token: generateToken(doctor._id),
      user: doctor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Hospital adds a doctor to their roster with star doctor option
 */
export const addDoctorByHospital = async (req, res) => {
  try {
    const { name, email, specialization, experience, fees, isStarDoctor, hospitalId, hospitalName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Doctor email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let doctor = await Doctor.findOne({ email: cleanEmail });

    if (doctor) {
      if (hospitalName) doctor.hospital = hospitalName;
      if (isStarDoctor !== undefined) doctor.isStarDoctor = Boolean(isStarDoctor);
      await doctor.save();
    } else {
      const docName = name && name.trim() ? name.trim() : ('Dr. ' + cleanEmail.split('@')[0].replace(/[._-]/g, ' '));
      doctor = await Doctor.create({
        name: docName,
        email: cleanEmail,
        password: 'CHANGEME_PENDING_SETUP',
        specialization: specialization || 'General Medicine',
        experience: Number(experience) || 5,
        fees: Number(fees) || 500,
        hospital: hospitalName || '',
        isStarDoctor: Boolean(isStarDoctor),
        isFirstLogin: true,
        passwordSet: false,
        about: `Clinical specialist affiliated with ${hospitalName || 'hospital'}.`
      });
    }

    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (hospital) {
        if (!Array.isArray(hospital.staff_emails)) hospital.staff_emails = [];
        if (!hospital.staff_emails.includes(cleanEmail)) {
          hospital.staff_emails.push(cleanEmail);
        }
        if (!Array.isArray(hospital.staff_doctors)) hospital.staff_doctors = [];
        if (!hospital.staff_doctors.some(d => d.email === cleanEmail)) {
          hospital.staff_doctors.push({ name: doctor.name, email: cleanEmail });
        }
        if (isStarDoctor) {
          if (!Array.isArray(hospital.star_doctors)) hospital.star_doctors = [];
          if (!hospital.star_doctors.some(id => String(id) === String(doctor._id))) {
            hospital.star_doctors.push(doctor._id);
          }
        }
        await hospital.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Doctor added successfully to hospital roster!',
      data: doctor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select('-password -slots_booked');
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (doctor) {
      res.json({ success: true, data: doctor });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const doctorDashboard = async (req, res) => {
  try {
    const appointments = await Appointment.find({ docId: req.user.id });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorProfile = async (req, res) => {
  try {
    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      doctor = await Doctor.findById(req.params.id);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: req.params.id });
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // FAQs on doctor page can only be updated by the hospital or admin, not by the doctor
    const updateData = { ...req.body };
    delete updateData.faqs;

    Object.assign(doctor, updateData);
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
    if (req.file) {
      doctor.image = req.file.path;
    } else if (req.body.image) {
      doctor.image = req.body.image;
    }
    if (req.body.reels !== undefined) {
      doctor.reels = Array.isArray(req.body.reels) ? req.body.reels : [];
      doctor.markModified('reels');
    }
    if (req.body.youtube_videos !== undefined) {
      doctor.youtube_videos = Array.isArray(req.body.youtube_videos) ? req.body.youtube_videos : [];
      doctor.markModified('youtube_videos');
    }

    const updated = await doctor.save();
    return res.json({ success: true, message: 'Doctor profile updated', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoctorProfile = async (req, res) => {
  try {
    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      doctor = await Doctor.findById(req.params.id);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: req.params.id });
    }
    if (doctor) {
      await doctor.deleteOne();
      return res.json({ success: true, message: 'Doctor profile deleted successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

