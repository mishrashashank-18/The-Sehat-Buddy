import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import validatePassword from '../utils/validatePassword.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';

export const authDoctor = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const doctor = await Doctor.findOne({ email: (email || '').toLowerCase().trim() }).select('+password +failedLoginAttempts +lockUntil');
    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Account lockout check
    if (doctor.lockUntil && doctor.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((doctor.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    if (await doctor.matchPassword(password)) {
      if (doctor.failedLoginAttempts > 0 || doctor.lockUntil) {
        doctor.failedLoginAttempts = 0;
        doctor.lockUntil = undefined;
        await doctor.save();
      }

      const docObj = doctor.toObject();
      delete docObj.password;
      delete docObj.otp;
      delete docObj.otpExpires;
      delete docObj.otpAttempts;

      return res.json({
        success: true,
        token: generateToken(doctor._id, 'doctor', doctor.tokenVersion || 0),
        user: docObj
      });
    } else {
      doctor.failedLoginAttempts = (doctor.failedLoginAttempts || 0) + 1;
      if (doctor.failedLoginAttempts >= 5) {
        doctor.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        doctor.failedLoginAttempts = 0;
        await doctor.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      await doctor.save();
      const remainingAttempts = Math.max(0, 5 - doctor.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remainingAttempts} attempt(s) remaining before temporary lockout.`
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    doctor.password = password;
    doctor.isFirstLogin = false;
    doctor.passwordSet = true;
    doctor.tokenVersion = (doctor.tokenVersion || 0) + 1;
    doctor.failedLoginAttempts = 0;
    doctor.lockUntil = undefined;
    await doctor.save();

    const docObj = doctor.toObject();
    delete docObj.password;
    delete docObj.otp;
    delete docObj.otpExpires;
    delete docObj.otpAttempts;

    return res.json({
      success: true,
      message: 'Password set successfully! Logging in...',
      token: generateToken(doctor._id, 'doctor', doctor.tokenVersion),
      user: docObj
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
    doctor.otpAttempts = 0;
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

    return res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${doctor.email}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify doctor reset OTP with attempt rate limiting
 */
export const verifyDoctorResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpires +otpAttempts');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    if (doctor.otpAttempts && doctor.otpAttempts >= 5) {
      doctor.otp = undefined;
      doctor.otpExpires = undefined;
      await doctor.save();
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. This OTP has been invalidated for security. Please request a new OTP.'
      });
    }

    if (doctor.otpExpires && new Date(doctor.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (!doctor.otp || doctor.otp !== String(otp).trim()) {
      doctor.otpAttempts = (doctor.otpAttempts || 0) + 1;
      await doctor.save();
      const remaining = Math.max(0, 5 - doctor.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`
      });
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

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const doctor = await Doctor.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpires +otpAttempts');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    if (doctor.otpAttempts && doctor.otpAttempts >= 5) {
      doctor.otp = undefined;
      doctor.otpExpires = undefined;
      await doctor.save();
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. This OTP has been invalidated. Please request a new OTP.'
      });
    }

    if (doctor.otpExpires && new Date(doctor.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (!doctor.otp || doctor.otp !== String(otp).trim()) {
      doctor.otpAttempts = (doctor.otpAttempts || 0) + 1;
      await doctor.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    doctor.password = password;
    doctor.isFirstLogin = false;
    doctor.passwordSet = true;
    doctor.tokenVersion = (doctor.tokenVersion || 0) + 1;
    doctor.failedLoginAttempts = 0;
    doctor.lockUntil = undefined;
    doctor.otp = undefined;
    doctor.otpExpires = undefined;
    doctor.otpAttempts = 0;
    await doctor.save();

    const docObj = doctor.toObject();
    delete docObj.password;
    delete docObj.otp;
    delete docObj.otpExpires;
    delete docObj.otpAttempts;

    return res.json({
      success: true,
      message: 'Password reset successfully! Logging in...',
      token: generateToken(doctor._id, 'doctor', doctor.tokenVersion),
      user: docObj
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

    broadcastDbChange('doctors', 'insert', doctor._id, doctor);
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
    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      doctor = await Doctor.findById(req.params.id).select('-password');
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: req.params.id }).select('-password');
    }
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
    const docId = String(req.query.docId || req.user?.id || '').trim();
    const docEmail = String(req.query.email || req.user?.email || '').toLowerCase().trim();

    if (!docId && !docEmail) {
      return res.json({ success: true, data: [] });
    }

    const conditions = [];
    if (docId) {
      conditions.push(
        { docId: docId },
        { 'docData._id': docId },
        { 'docData.id': docId }
      );
    }
    if (docEmail) {
      conditions.push(
        { docId: docEmail },
        { 'docData.email': docEmail }
      );
    }

    const appointments = await Appointment.find({ $or: conditions }).sort({ createdAt: -1, date: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isCompleted, cancelled } = req.body;
    let apt = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      apt = await Appointment.findById(id);
    }
    if (!apt) {
      apt = await Appointment.findOne({ id: id });
    }
    if (!apt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status !== undefined) apt.status = status;
    if (isCompleted !== undefined) apt.isCompleted = Boolean(isCompleted);
    if (cancelled !== undefined) apt.cancelled = Boolean(cancelled);
    if (status === 'Completed') apt.isCompleted = true;
    if (status === 'Cancelled') apt.cancelled = true;
    if (status === 'Confirmed' || status === 'In-Progress') {
      apt.isCompleted = false;
      apt.cancelled = false;
    }

    await apt.save();
    broadcastDbChange('appointments', 'update', apt._id.toString(), apt);
    res.json({ success: true, message: 'Appointment updated', data: apt });
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

    // Authorization verification
    const isSelf = req.user && req.user.id === doctor._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    const isHospital = req.user && req.user.role === 'hospital';

    if (!isSelf && !isAdmin && !isHospital) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this doctor profile'
      });
    }

    // STRICT WHITELIST: Prevent mass assignment of sensitive/credential fields
    const allowedFields = [
      'name', 'specialization', 'experience', 'jobTitle', 'about', 'fees',
      'address', 'hospital', 'qualifications', 'contact_number', 'instagram',
      'facebook', 'linkedin', 'twitter', 'available', 'availabilityStatus',
      'licenseNumber', 'awards', 'certifications', 'memberships',
      'careerExperience', 'reels', 'youtube_videos', 'rating', 'reviews', 'isStarDoctor',
      'availableDays', 'scheduleDays', 'availableSlots', 'slotDuration'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'address') {
          try {
            doctor.address = typeof req.body.address === 'string' ? JSON.parse(req.body.address) : req.body.address;
          } catch {
            doctor.address = req.body.address;
          }
        } else if (field === 'experience') {
          const expNum = parseInt(req.body.experience, 10);
          doctor.experience = !isNaN(expNum) ? expNum : (doctor.experience || 5);
        } else if (field === 'fees' || field === 'price') {
          const feesNum = Number(req.body.fees ?? req.body.price);
          doctor.fees = !isNaN(feesNum) ? feesNum : (doctor.fees || 500);
        } else if (field === 'slotDuration') {
          const durNum = Number(req.body.slotDuration);
          doctor.slotDuration = !isNaN(durNum) ? durNum : (doctor.slotDuration || 20);
        } else if (
          field !== 'awards' &&
          field !== 'certifications' &&
          field !== 'memberships' &&
          field !== 'careerExperience' &&
          field !== 'reels' &&
          field !== 'youtube_videos' &&
          field !== 'availableSlots' &&
          field !== 'scheduleDays'
        ) {
          doctor[field] = req.body[field];
        }
        doctor.markModified(field);
      }
    });

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
    if (req.body.reels !== undefined) {
      doctor.reels = Array.isArray(req.body.reels)
        ? req.body.reels.map(r => (typeof r === 'string' ? r.trim() : '')).filter(Boolean)
        : [];
      doctor.markModified('reels');
    }
    if (req.body.youtube_videos !== undefined) {
      doctor.youtube_videos = Array.isArray(req.body.youtube_videos)
        ? req.body.youtube_videos.map(v => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
        : [];
      doctor.markModified('youtube_videos');
    }
    if (req.body.availableSlots !== undefined) {
      doctor.availableSlots = Array.isArray(req.body.availableSlots)
        ? req.body.availableSlots.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
        : [];
      doctor.markModified('availableSlots');
    }
    if (req.body.scheduleDays !== undefined) {
      doctor.scheduleDays = Array.isArray(req.body.scheduleDays)
        ? req.body.scheduleDays.map(d => (typeof d === 'string' ? d.trim() : '')).filter(Boolean)
        : [];
      doctor.markModified('scheduleDays');
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

    const updated = await doctor.save();
    const docObj = updated.toObject();
    delete docObj.password;
    delete docObj.otp;
    delete docObj.otpExpires;
    delete docObj.otpAttempts;

    broadcastDbChange('doctors', 'update', docObj._id, docObj);
    return res.json({ success: true, message: 'Doctor profile updated', data: docObj });
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
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const isSelf = req.user && req.user.id === doctor._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    const isHospital = req.user && req.user.role === 'hospital';

    if (!isSelf && !isAdmin && !isHospital) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the doctor, an administrator, or affiliated hospital can delete this profile'
      });
    }

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
    return res.json({ success: true, message: 'Doctor profile and associated assets deleted permanently' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

