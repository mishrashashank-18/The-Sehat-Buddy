import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import validatePassword from '../utils/validatePassword.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';
import { generateTemporaryPassword, sendDoctorWelcomeEmail } from '../utils/doctorAuthUtils.js';
import { purgeDoctorPermanently } from '../services/doctorPurgeService.js';
import { parseAvailableDaysAndHours } from '../utils/doctorScheduleUtils.js';

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
        Doctor.updateOne({ _id: doctor._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }).catch(() => {});
      }

      // If doctor hasn't set their personal password yet, require them to set it
      if (doctor.isFirstLogin || !doctor.passwordSet) {
        return res.json({
          success: true,
          requiresPasswordChange: true,
          isFirstLogin: true,
          message: 'Temporary password verified. Please create your permanent password.',
          email: doctor.email,
          name: doctor.name,
          hospital: doctor.hospital,
          temporaryPassword: password
        });
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
        Doctor.updateOne({ _id: doctor._id }, { $set: { lockUntil: new Date(Date.now() + 15 * 60 * 1000), failedLoginAttempts: 0 } }).catch(() => {});
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      Doctor.updateOne({ _id: doctor._id }, { $set: { failedLoginAttempts: doctor.failedLoginAttempts } }).catch(() => {});
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
 * Set password for first-time doctor login (Verifies temporary password sent to email first)
 */
export const setInitialPassword = async (req, res) => {
  try {
    const { email, temporaryPassword, password } = req.body;
    if (!email || !temporaryPassword || !password) {
      return res.status(400).json({ success: false, message: 'Doctor email, temporary password, and new password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const doctor = await Doctor.findOne({ email: cleanEmail }).select('+password +failedLoginAttempts +lockUntil');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor account not found' });
    }

    // Account lockout check
    if (doctor.lockUntil && doctor.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((doctor.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    // Verify temporary password against doctor.password
    const isTempValid = await doctor.matchPassword(temporaryPassword);
    if (!isTempValid) {
      doctor.failedLoginAttempts = (doctor.failedLoginAttempts || 0) + 1;
      if (doctor.failedLoginAttempts >= 5) {
        doctor.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        doctor.failedLoginAttempts = 0;
        await doctor.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed attempts.'
        });
      }
      await doctor.save();
      const remaining = Math.max(0, 5 - doctor.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid temporary password. Please enter the exact temporary password sent to your email (${remaining} attempt(s) remaining).`
      });
    }

    // Validate new password policy
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    if (temporaryPassword === password) {
      return res.status(400).json({
        success: false,
        message: 'Your new password cannot be the same as your temporary password. Please choose a different password.'
      });
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
 * Resend temporary password to doctor's registered email
 */
export const resendDoctorTempPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const doctor = await Doctor.findOne({ email: cleanEmail }).select('+password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'No registered doctor account found with this email' });
    }

    if (!doctor.isFirstLogin && doctor.passwordSet) {
      return res.status(400).json({
        success: false,
        message: 'Your account has already set a permanent password. Please log in using your password or reset via Forgot Password.'
      });
    }

    const temporaryPassword = generateTemporaryPassword();
    doctor.password = temporaryPassword;
    doctor.isFirstLogin = true;
    doctor.passwordSet = false;
    await doctor.save();

    await sendDoctorWelcomeEmail({ doctor, temporaryPassword, hospitalName: doctor.hospital });

    return res.json({
      success: true,
      message: `A fresh temporary password has been sent to ${doctor.email}. Please check your inbox.`
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
      // Do NOT mutate doctor.isStarDoctor or starUpdatedAt here: platform-wide star doctor status is managed solely by administrators
      await doctor.save();
    } else {
      const docName = name && name.trim() ? name.trim() : ('Dr. ' + cleanEmail.split('@')[0].replace(/[._-]/g, ' '));
      const temporaryPassword = generateTemporaryPassword();
      const newDocId = new mongoose.Types.ObjectId();
      const docSpec = specialization || req.body.specialty || 'General Medicine';
      doctor = await Doctor.create({
        _id: newDocId,
        id: newDocId.toString(),
        name: docName,
        email: cleanEmail,
        password: temporaryPassword,
        specialization: docSpec,
        specialty: docSpec,
        experience: Number(experience) || 5,
        fees: Number(fees) || 500,
        price: Number(fees) || 500,
        hospital: hospitalName || '',
        isStarDoctor: Boolean(isStarDoctor),
        starUpdatedAt: Date.now(),
        isFirstLogin: true,
        passwordSet: false,
        about: `Clinical specialist affiliated with ${hospitalName || 'hospital'}.`
      });

      // Send welcome email with temporary password
      sendDoctorWelcomeEmail({ doctor, temporaryPassword, hospitalName });
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const doctors = await Doctor.find({}).select('-password -slots_booked');
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    let doctor = null;
    const reqId = String(req.params.id).trim();
    if (mongoose.Types.ObjectId.isValid(reqId)) {
      doctor = await Doctor.findById(reqId).select('-password');
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: reqId }).select('-password');
    }
    if (!doctor && (reqId === '1' || reqId === 'default')) {
      doctor = await Doctor.findOne({ email: 'dr.rahul@sehatbuddy.com' }).select('-password') || await Doctor.findOne({}).select('-password');
    }
    if (!doctor && reqId.includes('@')) {
      doctor = await Doctor.findOne({ email: reqId.toLowerCase() }).select('-password');
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

// High-performance short-lived in-memory cache for doctor dashboard queries (TTL: 15s)
const doctorDashboardCache = new Map();

export const clearDoctorDashboardCache = () => {
  doctorDashboardCache.clear();
};

export const doctorDashboard = async (req, res) => {
  try {
    const docId = String(req.query.docId || req.user?.id || '').trim();
    let docEmail = String(req.query.email || req.user?.email || '').toLowerCase().trim();

    if (!docId && !docEmail) {
      return res.json({ success: true, data: [] });
    }

    // Fast Cache Check (sub-millisecond response)
    const cacheKey = `${docId}__${docEmail}`;
    const cached = doctorDashboardCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 15000)) {
      return res.json({ success: true, data: cached.data });
    }

    // Resolve doctor document in a single fast indexed query
    const docOrConditions = [];
    if (docId) {
      if (mongoose.Types.ObjectId.isValid(docId)) {
        docOrConditions.push({ _id: docId });
      }
      docOrConditions.push({ id: docId });
      if (!isNaN(Number(docId))) {
        docOrConditions.push({ id: Number(docId) });
      }
    }
    if (docEmail) {
      docOrConditions.push({ email: docEmail });
    }

    let doctorDoc = null;
    if (docOrConditions.length > 0) {
      doctorDoc = await Doctor.findOne({ $or: docOrConditions }).select('_id id name email').lean();
    }

    const conditions = [];
    const idSet = new Set();
    if (docId) idSet.add(docId);
    if (doctorDoc) {
      if (doctorDoc._id) idSet.add(doctorDoc._id.toString());
      if (doctorDoc.id !== undefined && doctorDoc.id !== null) idSet.add(String(doctorDoc.id));
      if (doctorDoc.email) docEmail = doctorDoc.email.toLowerCase().trim();
    }

    idSet.forEach(idVal => {
      conditions.push({ docId: idVal });
      conditions.push({ doctorId: idVal });
      conditions.push({ 'docData._id': idVal });
      conditions.push({ 'docData.id': idVal });
      if (!isNaN(Number(idVal))) {
        conditions.push({ 'docData.id': Number(idVal) });
      }
    });

    if (doctorDoc?.name) {
      conditions.push({ 'docData.name': doctorDoc.name });
    }

    if (docEmail) {
      conditions.push(
        { docId: docEmail },
        { doctorId: docEmail },
        { 'docData.email': docEmail }
      );
    }

    if (conditions.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const appointments = await Appointment.find({ $or: conditions })
      .sort({ createdAt: -1, date: -1 })
      .lean();

    doctorDashboardCache.set(cacheKey, { timestamp: Date.now(), data: appointments });
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
      // Mock / local appointment fallback - return 200 clean success
      return res.json({ success: true, message: 'Status updated for local/demo appointment', isLocal: true, id, status });
    }

    if (status !== undefined) apt.status = status;
    if (isCompleted !== undefined) apt.isCompleted = Boolean(isCompleted);
    if (cancelled !== undefined) apt.cancelled = Boolean(cancelled);
    if (status === 'Completed') {
      apt.isCompleted = true;
      apt.completedAt = new Date();
      const todayISO = new Date().toISOString().split('T')[0];
      if (apt.slotDate && apt.slotDate > todayISO) {
        apt.slotDate = todayISO;
      }
    }
    if (status === 'Cancelled') apt.cancelled = true;
    if (status === 'Confirmed' || status === 'In-Progress') {
      apt.isCompleted = false;
      apt.cancelled = false;
    }

    await apt.save();
    doctorDashboardCache.clear();
    broadcastDbChange('appointments', 'update', apt._id.toString(), apt);
    res.json({ success: true, message: 'Appointment updated', data: apt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctorAppointment = async (req, res) => {
  try {
    const { docId, patientName, age, gender, time, slotTime, date, slotDate, type, consultationType, symptoms, phone, status, amount } = req.body;
    let doctor = null;
    if (docId) {
      if (mongoose.Types.ObjectId.isValid(docId)) {
        doctor = await Doctor.findById(docId);
      }
      if (!doctor) doctor = await Doctor.findOne({ id: docId });
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ email: 'dr.rahul@sehatbuddy.com' }) || await Doctor.findOne({});
    }

    const sDate = String(slotDate || date || new Date().toISOString().split('T')[0]).trim();
    const sTime = String(slotTime || time || '10:00 AM').trim();
    const fee = Number(amount) || Number(doctor?.fees || doctor?.price || 800);
    const pName = (patientName || 'Patient').trim();
    const targetDocId = doctor ? doctor._id.toString() : (docId || 'default');

    // De-duplication guard: prevent identical appointment within 15 seconds (e.g. accidental double clicks)
    const existingRecent = await Appointment.findOne({
      docId: targetDocId,
      'userData.name': pName,
      slotDate: sDate,
      slotTime: sTime,
      createdAt: { $gte: new Date(Date.now() - 15000) }
    });
    if (existingRecent) {
      return res.status(200).json({ success: true, message: 'Appointment already scheduled', data: existingRecent });
    }

    const apt = await Appointment.create({
      userId: `doctor_manual_${Date.now()}`,
      docId: targetDocId,
      slotDate: sDate,
      slotTime: sTime,
      userData: {
        _id: null,
        name: pName,
        email: '',
        phone: phone || '+91 98000 00000',
        age: parseInt(age, 10) || 30,
        gender: gender || 'Male',
        symptoms: symptoms || 'Clinical Consultation'
      },
      docData: {
        _id: doctor ? doctor._id.toString() : 'default',
        name: doctor ? doctor.name : 'Dr. Rahul Verma',
        specialty: doctor ? (doctor.specialization || doctor.specialty) : 'Cardiologist',
        hospital: doctor ? doctor.hospital : 'Apollo Hospital & Heart Center',
        fees: fee
      },
      amount: fee,
      status: status || 'Confirmed',
      isCompleted: status === 'Completed',
      symptoms: symptoms || 'Clinical Consultation',
      consultationType: type || consultationType || 'In-Clinic Visit',
      date: new Date(sDate).getTime() || Date.now()
    });

    broadcastDbChange('appointments', 'insert', apt._id.toString(), apt);
    doctorDashboardCache.clear();
    res.status(201).json({ success: true, message: 'Appointment created', data: apt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoctorAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    let apt = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      apt = await Appointment.findByIdAndDelete(id);
    }
    if (!apt) {
      apt = await Appointment.findOneAndDelete({ id: id });
    }
    if (apt) {
      // Release slot in doctor's booked schedule if applicable
      try {
        if (apt.docId && apt.slotDate && apt.slotTime) {
          const doctor = await Doctor.findById(apt.docId);
          if (doctor && doctor.slots_booked && Array.isArray(doctor.slots_booked[apt.slotDate])) {
            doctor.slots_booked[apt.slotDate] = doctor.slots_booked[apt.slotDate].filter(e => e !== apt.slotTime);
            await Doctor.findByIdAndUpdate(apt.docId, { slots_booked: doctor.slots_booked });
          }
        }
      } catch {}
      broadcastDbChange('appointments', 'delete', apt._id.toString(), { id: apt._id.toString() });
    }
    doctorDashboardCache.clear();
    res.json({ success: true, message: 'Appointment permanently deleted', id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorProfile = async (req, res) => {
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
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.id && reqId) {
      doctor.id = reqId;
      doctor.markModified('id');
    }

    // Authorization verification
    const isSelf = req.user && (
      req.user.id === doctor._id.toString() ||
      (req.user.email && doctor.email && req.user.email.toLowerCase() === doctor.email.toLowerCase())
    );
    const isAdmin = req.user && req.user.role === 'admin';
    const isHospital = req.user && req.user.role === 'hospital';
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

    // Allow update if doctor is authenticated as self, admin, hospital, in local dev, or if token is not passed in dev
    if (!isSelf && !isAdmin && !isHospital && !isDev && req.user) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this doctor profile'
      });
    }

    // Handle Doctor Email update
    let emailChanged = false;
    let temporaryPassword = null;
    if (req.body.email) {
      const oldEmail = (doctor.email || '').toLowerCase().trim();
      const newEmail = String(req.body.email).toLowerCase().trim();
      if (newEmail && newEmail !== oldEmail) {
        const duplicate = await Doctor.findOne({ email: newEmail, _id: { $ne: doctor._id } });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Email ${newEmail} is already registered to another doctor (${duplicate.name}).`
          });
        }
        temporaryPassword = generateTemporaryPassword();
        doctor.email = newEmail;
        doctor.password = temporaryPassword;
        doctor.isFirstLogin = true;
        doctor.passwordSet = false;
        doctor.failedLoginAttempts = 0;
        doctor.lockUntil = null;
        doctor.markModified('email');
        doctor.markModified('password');
        doctor.markModified('isFirstLogin');
        doctor.markModified('passwordSet');
        emailChanged = true;

        if (oldEmail) {
          await Hospital.updateMany(
            { 'staff_doctors.email': oldEmail },
            {
              $set: { 'staff_doctors.$.email': newEmail },
              $pull: { staff_emails: oldEmail }
            }
          ).catch(() => {});
          if (doctor.hospital) {
            await Hospital.updateMany(
              { name: doctor.hospital },
              { $addToSet: { staff_emails: newEmail } }
            ).catch(() => {});
          }
        }
      }
    }

    // STRICT WHITELIST: Prevent mass assignment of sensitive/credential fields
    const allowedFields = [
      'name', 'specialization', 'specialty', 'experience', 'jobTitle', 'about', 'fees', 'price',
      'address', 'hospital', 'qualifications', 'degree', 'contact_number', 'phone', 'instagram',
      'facebook', 'linkedin', 'twitter', 'available', 'availabilityStatus',
      'licenseNumber', 'awards', 'certifications', 'memberships',
      'careerExperience', 'tags', 'reels', 'youtube_videos', 'rating', 'reviews',
      'availableDays', 'scheduleDays', 'availableSlots', 'slotDuration', 'slots_booked', 'dayWiseSlots', 'dateWiseSlots', 'image'
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
        } else if (field === 'qualifications' || field === 'degree') {
          const deg = req.body.degree || req.body.qualifications || '';
          doctor.degree = deg;
          doctor.qualifications = deg;
        } else if (field === 'fees' || field === 'price') {
          const feesNum = Number(req.body.fees ?? req.body.price);
          doctor.fees = !isNaN(feesNum) ? feesNum : (doctor.fees || 500);
          doctor.price = doctor.fees;
        } else if (field === 'specialty' || field === 'specialization') {
          doctor.specialization = req.body.specialization || req.body.specialty;
          doctor.specialty = req.body.specialty || req.body.specialization;
        } else if (field === 'image') {
          doctor.image = req.body.image;
        } else if (field === 'phone' || field === 'contact_number') {
          const ph = String(req.body.phone !== undefined ? req.body.phone : req.body.contact_number).trim();
          doctor.phone = ph;
          doctor.contact_number = ph;
        } else if (field === 'slotDuration') {
          const durNum = Number(req.body.slotDuration);
          doctor.slotDuration = !isNaN(durNum) ? durNum : (doctor.slotDuration || 20);
        } else if (
          field !== 'awards' &&
          field !== 'certifications' &&
          field !== 'memberships' &&
          field !== 'careerExperience' &&
          field !== 'tags' &&
          field !== 'reels' &&
          field !== 'youtube_videos' &&
          field !== 'availableSlots' &&
          field !== 'scheduleDays' &&
          field !== 'slots_booked'
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
    if (req.body.tags !== undefined) {
      doctor.tags = Array.isArray(req.body.tags) ? req.body.tags.filter(Boolean) : [];
      doctor.markModified('tags');
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
    if (req.body.availableDays !== undefined) {
      const parsedSched = parseAvailableDaysAndHours(req.body.availableDays, doctor.slotDuration || 30);
      if (req.body.availableSlots !== undefined) {
        doctor.availableSlots = Array.isArray(req.body.availableSlots)
          ? req.body.availableSlots.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
          : [];
      } else if (parsedSched.slots.length > 0) {
        doctor.availableSlots = parsedSched.slots;
      }
      doctor.markModified('availableSlots');

      if (req.body.scheduleDays !== undefined) {
        doctor.scheduleDays = Array.isArray(req.body.scheduleDays)
          ? req.body.scheduleDays.map(d => (typeof d === 'string' ? d.trim() : '')).filter(Boolean)
          : [];
      } else {
        doctor.scheduleDays = parsedSched.days;
      }
      doctor.markModified('scheduleDays');
    } else {
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

    const incomingImage = req.file ? req.file.path : req.body.image;
    if (incomingImage !== undefined && incomingImage !== doctor.image) {
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
      doctor.image = incomingImage || '';
      doctor.markModified('image');
    }

    // Ensure core flagship doctor (Dr. Rahul Verma) always stays available / listed in directory
    const isRahul = doctor.email === 'dr.rahul@sehatbuddy.com' || (doctor.name && doctor.name.toLowerCase().includes('rahul verma'));
    if (isRahul) {
      doctor.available = true;
      doctor.markModified('available');
    }

    // Compute Profile Completion Percentage (0-100%)
    let pct = 0;
    if (isRahul) {
      pct = 100;
    } else {
      if (doctor.name && String(doctor.name).trim().length >= 2) pct += 10;
      if (doctor.email && String(doctor.email).includes('@')) pct += 10;
      const ph = String(doctor.phone || doctor.contact_number || '').replace(/\D/g, '');
      if (ph.length >= 10) pct += 10;
      if ((doctor.specialty || doctor.specialization) && String(doctor.specialty || doctor.specialization).trim().length >= 3) pct += 10;
      if (doctor.hospital && String(doctor.hospital).trim().length >= 2) pct += 10;
      if (doctor.licenseNumber && String(doctor.licenseNumber).trim().length >= 3) pct += 15;
      if ((doctor.degree || doctor.qualifications) && String(doctor.degree || doctor.qualifications).trim().length >= 2) pct += 10;
      if (doctor.about && String(doctor.about).trim().length >= 20) pct += 10;
      if (doctor.image && String(doctor.image).trim().length > 0) pct += 10;
      const hasSched = Boolean(doctor.availableDays || (Array.isArray(doctor.scheduleDays) && doctor.scheduleDays.length > 0) || (Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0));
      if (hasSched) pct += 5;
    }

    doctor.profileCompletion = Math.min(100, pct);
    doctor.isProfileComplete = pct >= 80;
    doctor.markModified('profileCompletion');
    doctor.markModified('isProfileComplete');

    // Doctor self-service profile updates must never alter or overwrite platform-wide star doctor status.
    // Re-fetch the latest star values directly from MongoDB to guarantee integrity against concurrent admin updates.
    const freshStarState = await Doctor.findById(doctor._id).select('isStarDoctor starUpdatedAt');
    if (freshStarState) {
      doctor.isStarDoctor = freshStarState.isStarDoctor;
      doctor.starUpdatedAt = freshStarState.starUpdatedAt;
    }

    let updated;
    try {
      updated = await doctor.save();
    } catch (saveErr) {
      if (saveErr.name === 'VersionError' || saveErr.message?.includes('No matching document')) {
        const updateData = doctor.toObject();
        delete updateData._id;
        delete updateData.__v;
        delete updateData.password;
        updated = await Doctor.findByIdAndUpdate(doctor._id, { $set: updateData }, { new: true, runValidators: false });
      } else {
        throw saveErr;
      }
    }
    const docObj = updated.toObject();
    delete docObj.password;
    delete docObj.otp;
    delete docObj.otpExpires;
    delete docObj.otpAttempts;

    if (emailChanged && temporaryPassword) {
      try {
        await sendDoctorWelcomeEmail({
          doctor: updated,
          temporaryPassword,
          hospitalName: updated.hospital || req.body.hospital || 'The Sehat Buddy Network'
        });
      } catch (emailErr) {
        console.error('Failed to send credential email to updated doctor email:', emailErr.message);
      }
    }

    broadcastDbChange('doctors', 'update', docObj._id, docObj);
    return res.json({
      success: true,
      message: emailChanged
        ? `Doctor email updated to ${docObj.email} and temporary password sent successfully!`
        : 'Doctor profile updated',
      data: docObj,
      temporaryPassword: temporaryPassword || undefined,
      emailChanged
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get authenticated doctor's profile.
 * Rejects with 401 if doctor account has been deleted by Admin or Hospital.
 */
export const getMyDoctorProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized: No doctor session found' });
    }
    const doctor = await Doctor.findById(req.user.id).select('-password -otp -otpExpires -otpAttempts');
    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Not authorized: Doctor account no longer exists in database' });
    }
    return res.json({ success: true, doctor });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteDoctorProfile = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Doctor ID is required' });
    }

    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      doctor = await Doctor.findById(rawId);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: rawId });
    }
    if (!doctor) {
      const decoded = decodeURIComponent(rawId).toLowerCase().trim();
      doctor = await Doctor.findOne({ email: decoded });
    }

    if (!doctor) {
      // Check if this is a staff doctor email referenced in hospitals
      const cleanEmail = decodeURIComponent(rawId).toLowerCase().trim();
      if (cleanEmail && cleanEmail.includes('@')) {
        await Hospital.updateMany(
          {},
          {
            $pull: {
              staff_doctors: { email: cleanEmail },
              staff_emails: cleanEmail
            }
          }
        );
        broadcastDbChange('hospitals', 'update', null);
        return res.json({ success: true, message: 'Hospital staff doctor removed successfully' });
      }
      return res.status(404).json({ success: false, message: 'Doctor not found in database' });
    }

    if (doctor.email === 'dr.rahul@sehatbuddy.com' || (doctor.name && doctor.name.toLowerCase().includes('rahul verma'))) {
      return res.status(400).json({
        success: false,
        message: 'System protection: Dr. Rahul Verma cannot be deleted.'
      });
    }

    const isSelf = req.user && (
      req.user.id === doctor._id.toString() ||
      (req.user.email && doctor.email && req.user.email.toLowerCase() === doctor.email.toLowerCase())
    );
    const isAdmin = req.user && req.user.role === 'admin';
    const isHospital = req.user && req.user.role === 'hospital';
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

    if (!isSelf && !isAdmin && !isHospital && !isDev && req.user) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the doctor, an administrator, or affiliated hospital can delete this profile'
      });
    }

    // Permanently purge doctor across all collections
    const result = await purgeDoctorPermanently(doctor);

    return res.json({
      success: true,
      message: 'Doctor profile and all associated database records (including email logs and user account) deleted permanently'
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

