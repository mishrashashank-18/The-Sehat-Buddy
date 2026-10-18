import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import validatePassword from '../utils/validatePassword.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

export const authHospital = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const hospital = await Hospital.findOne({ email: (email || '').toLowerCase().trim() }).select('+password +failedLoginAttempts +lockUntil');
    if (!hospital) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Account lockout check
    if (hospital.lockUntil && hospital.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((hospital.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    const isFirstLogin = Boolean(hospital.isFirstLogin || !hospital.passwordSet || hospital.password === 'CHANGEME_PENDING_SETUP');
    if (isFirstLogin) {
      return res.status(401).json({
        success: false,
        isFirstLogin: true,
        message: 'First-time login detected. Please create your password first.'
      });
    }

    if (await hospital.matchPassword(password)) {
      if (hospital.failedLoginAttempts > 0 || hospital.lockUntil) {
        hospital.failedLoginAttempts = 0;
        hospital.lockUntil = undefined;
        await hospital.save();
      }

      const hospObj = hospital.toObject();
      delete hospObj.password;
      delete hospObj.otp;
      delete hospObj.otpExpires;
      delete hospObj.otpAttempts;

      return res.json({
        success: true,
        token: generateToken(hospital._id, 'hospital', hospital.tokenVersion || 0),
        user: hospObj
      });
    } else {
      hospital.failedLoginAttempts = (hospital.failedLoginAttempts || 0) + 1;
      if (hospital.failedLoginAttempts >= 5) {
        hospital.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        hospital.failedLoginAttempts = 0;
        await hospital.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      await hospital.save();
      const remainingAttempts = Math.max(0, 5 - hospital.failedLoginAttempts);
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
 * Check if hospital email exists in database and determine if it's their first login
 */
export const checkHospitalEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'No registered hospital account found with this email. Please contact the platform administrator to register your hospital.'
      });
    }

    const isFirstLogin = Boolean(hospital.isFirstLogin || !hospital.passwordSet || hospital.password === 'CHANGEME_PENDING_SETUP');

    return res.json({
      success: true,
      exists: true,
      isFirstLogin,
      name: hospital.name,
      email: hospital.email,
      city: hospital.city
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Set password for first-time hospital login
 */
export const setInitialHospitalPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() });
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital account not found' });
    }

    hospital.password = password;
    hospital.isFirstLogin = false;
    hospital.passwordSet = true;
    hospital.tokenVersion = (hospital.tokenVersion || 0) + 1;
    hospital.failedLoginAttempts = 0;
    hospital.lockUntil = undefined;
    await hospital.save();

    const hospObj = hospital.toObject();
    delete hospObj.password;
    delete hospObj.otp;
    delete hospObj.otpExpires;
    delete hospObj.otpAttempts;

    return res.json({
      success: true,
      message: 'Password set successfully! Logging in...',
      token: generateToken(hospital._id, 'hospital', hospital.tokenVersion),
      user: hospObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Hospital requested OTP for password reset
 */
export const forgotHospitalPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'No registered hospital account found with this email. Please check your email or contact the platform administrator.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    hospital.otp = otp;
    hospital.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    hospital.otpAttempts = 0;
    await hospital.save();

    try {
      await sendEmail({
        email: hospital.email,
        subject: 'Password Reset OTP - Sehat Buddy Hospital Portal',
        message: `Hello ${hospital.name},\n\nYour OTP for resetting your hospital portal password is ${otp}. It is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 520px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 20px;">Sehat Buddy • Hospital Portal</h2>
            </div>
            <p style="font-size: 15px;">Hello <strong>${hospital.name}</strong>,</p>
            <p style="font-size: 14px; color: #475569;">You requested to reset your hospital portal password. Use the 6-digit OTP below to verify your identity and set a new password:</p>
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
      console.error('Error sending hospital password reset OTP email:', emailErr.message);
    }

    return res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${hospital.email}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify hospital reset OTP with attempt rate limiting
 */
export const verifyHospitalResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpires +otpAttempts');
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital account not found' });
    }

    if (hospital.otpAttempts && hospital.otpAttempts >= 5) {
      hospital.otp = undefined;
      hospital.otpExpires = undefined;
      await hospital.save();
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. This OTP has been invalidated for security. Please request a new OTP.'
      });
    }

    if (hospital.otpExpires && new Date(hospital.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (!hospital.otp || hospital.otp !== String(otp).trim()) {
      hospital.otpAttempts = (hospital.otpAttempts || 0) + 1;
      await hospital.save();
      const remaining = Math.max(0, 5 - hospital.otpAttempts);
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
 * Reset hospital password using verified OTP
 */
export const resetHospitalPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpires +otpAttempts');
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital account not found' });
    }

    if (hospital.otpAttempts && hospital.otpAttempts >= 5) {
      hospital.otp = undefined;
      hospital.otpExpires = undefined;
      await hospital.save();
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. This OTP has been invalidated. Please request a new OTP.'
      });
    }

    if (hospital.otpExpires && new Date(hospital.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (!hospital.otp || hospital.otp !== String(otp).trim()) {
      hospital.otpAttempts = (hospital.otpAttempts || 0) + 1;
      await hospital.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    hospital.password = newPassword;
    hospital.isFirstLogin = false;
    hospital.passwordSet = true;
    hospital.tokenVersion = (hospital.tokenVersion || 0) + 1;
    hospital.failedLoginAttempts = 0;
    hospital.lockUntil = undefined;
    hospital.otp = undefined;
    hospital.otpExpires = undefined;
    hospital.otpAttempts = 0;
    await hospital.save();

    const hospObj = hospital.toObject();
    delete hospObj.password;
    delete hospObj.otp;
    delete hospObj.otpExpires;
    delete hospObj.otpAttempts;

    return res.json({
      success: true,
      message: 'Password reset successfully! Logging you in...',
      token: generateToken(hospital._id, 'hospital', hospital.tokenVersion),
      user: hospObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper to ensure doctor staff accounts exist and are linked to hospital
 */
const syncHospitalStaff = async (hospitalName, staffList, hospitalId) => {
  if (!Array.isArray(staffList) || staffList.length === 0) return;

  for (const staffItem of staffList) {
    let cleanEmail = '';
    let doctorName = '';

    if (typeof staffItem === 'string') {
      cleanEmail = staffItem.toLowerCase().trim();
    } else if (staffItem && typeof staffItem === 'object') {
      cleanEmail = (staffItem.email || '').toLowerCase().trim();
      doctorName = (staffItem.name || '').trim();
    }

    if (!cleanEmail) continue;

    const existingDoctor = await Doctor.findOne({ email: cleanEmail });
    if (!existingDoctor) {
      let formattedName = doctorName;
      if (!formattedName) {
        const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        formattedName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
      } else if (!formattedName.toLowerCase().startsWith('dr.') && !formattedName.toLowerCase().startsWith('dr ')) {
        formattedName = 'Dr. ' + formattedName;
      }
      
      await Doctor.create({
        name: formattedName,
        email: cleanEmail,
        password: 'CHANGEME_PENDING_SETUP',
        specialization: 'General Physician',
        experience: 5,
        fees: 500,
        hospital: hospitalName,
        isFirstLogin: true,
        passwordSet: false,
        about: `Clinical specialist affiliated with ${hospitalName}.`
      });
    } else {
      let needsSave = false;
      if (!existingDoctor.hospital) {
        existingDoctor.hospital = hospitalName;
        needsSave = true;
      }
      // If doctor didn't have a customized name yet and a name is provided, update it
      if (doctorName && (!existingDoctor.name || existingDoctor.name.toLowerCase().includes(cleanEmail.split('@')[0]))) {
        let formattedName = doctorName;
        if (!formattedName.toLowerCase().startsWith('dr.') && !formattedName.toLowerCase().startsWith('dr ')) {
          formattedName = 'Dr. ' + formattedName;
        }
        existingDoctor.name = formattedName;
        needsSave = true;
      }
      if (needsSave) {
        await existingDoctor.save();
      }
    }
  }
};

export const registerHospital = async (req, res) => {
  const { name, email, password, address, city, state, zip, phone, description, specialities, rating, reviews, totalBeds, emergency24x7, establishedYear, reels, youtube_videos, star_doctors, staff_emails, latitude, longitude } = req.body;
  try {
    const hospitalExists = await Hospital.findOne({ email });
    if (hospitalExists) {
      return res.status(400).json({ success: false, message: 'Hospital already exists' });
    }
    
    let image = req.body.image || '';
    if (req.file) {
      image = req.file.path;
    }
    
    let parsedSpecialities = [];
    if (specialities) {
      parsedSpecialities = typeof specialities === 'string' ? JSON.parse(specialities) : specialities;
    }

    let parsedStaffEmails = [];
    if (staff_emails) {
      parsedStaffEmails = Array.isArray(staff_emails)
        ? staff_emails.map(e => e.trim().toLowerCase()).filter(Boolean)
        : String(staff_emails).split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    }

    let parsedStaffDoctors = [];
    if (req.body.staff_doctors) {
      parsedStaffDoctors = Array.isArray(req.body.staff_doctors) ? req.body.staff_doctors : [];
    }

    // Sync staff doctors BEFORE creating hospital so they get ObjectIds
    const combinedStaff = [
      ...parsedStaffDoctors,
      ...parsedStaffEmails.map(e => ({ email: e }))
    ];
    if (combinedStaff.length > 0) {
      await syncHospitalStaff(name, combinedStaff, null); // We don't have hospital._id yet, but that's fine, syncHospitalStaff doesn't strictly need it to create the doctor
    }

    const resolvedStarDoctors = [];
    const inputStarDoctors = Array.isArray(star_doctors) ? star_doctors : [];
    for (const sd of inputStarDoctors) {
      if (/^[0-9a-fA-F]{24}$/.test(sd)) {
        resolvedStarDoctors.push(sd);
      } else if (typeof sd === 'string' && sd.includes('@')) {
        const doc = await Doctor.findOne({ email: sd.trim().toLowerCase() });
        if (doc) resolvedStarDoctors.push(doc._id);
      }
    }

    const hospital = await Hospital.create({ 
      name, 
      email: email.toLowerCase().trim(), 
      password: password || 'CHANGEME_PENDING_SETUP', 
      address: address || (city ? `${city} Central Campus` : 'Main Medical Campus'), 
      city: city || 'Delhi', 
      state: state || '', 
      zip: zip || '', 
      phone: phone || '', 
      description: description || '', 
      specialities: parsedSpecialities, 
      image: image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      rating: rating || 4.8,
      reviews: reviews || '50+',
      totalBeds: totalBeds || 100,
      emergency24x7: emergency24x7 !== undefined ? emergency24x7 : true,
      establishedYear: establishedYear || 2005,
      isFirstLogin: true,
      passwordSet: false,
      reels: reels || [],
      youtube_videos: youtube_videos || [],
      star_doctors: resolvedStarDoctors,
      staff_emails: parsedStaffEmails,
      staff_doctors: parsedStaffDoctors,
      cashlessInsurance: req.body.cashlessInsurance !== undefined ? req.body.cashlessInsurance : true,
      acceptedInsurances: Array.isArray(req.body.acceptedInsurances) ? req.body.acceptedInsurances : ['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Care Health', 'Niva Bupa'],
      tpaHelpdesk: req.body.tpaHelpdesk || {
        phone: req.body.phone || '080-45678900',
        email: 'tpa@' + (email ? email.split('@')[1] : 'sehatbuddy.com'),
        preAuthTime: '30 Mins Cashless Pre-Approval'
      },
      insuranceHelpline: req.body.insuranceHelpline || '1800-SEHAT-CARE',
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined
    });
    
    if (hospital) {
      broadcastDbChange('hospitals', 'insert', hospital._id, hospital);
      res.status(201).json({
        success: true,
        token: generateToken(hospital._id),
        data: hospital
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid hospital data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).select('-password').populate('star_doctors', '-password');
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id).select('-password').populate('star_doctors', '-password');
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] }).select('-password').populate('star_doctors', '-password');
    }
    if (hospital) {
      res.json({ success: true, data: hospital });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHospital = async (req, res) => {
  try {
    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] });
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Authorization verification: only the hospital itself or a platform admin
    const isSelf = req.user && req.user.id === hospital._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this hospital profile'
      });
    }

    // STRICT WHITELIST: Prevent mass assignment of sensitive/credential fields
    const allowedFields = [
      'name', 'address', 'city', 'state', 'zip', 'phone', 'description',
      'rating', 'reviews', 'totalBeds', 'emergency24x7', 'establishedYear',
      'isVerified', 'cashlessInsurance', 'insuranceHelpline', 'latitude', 'longitude'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        hospital[field] = req.body[field];
        hospital.markModified(field);
      }
    });

    // Sync any new staff doctors & emails BEFORE saving so they get ObjectIds
    const incomingStaffDoctors = Array.isArray(req.body.staff_doctors) ? req.body.staff_doctors : (hospital.staff_doctors || []);
    const incomingStaffEmails = Array.isArray(req.body.staff_emails) 
        ? req.body.staff_emails.map(e => e.trim().toLowerCase()).filter(Boolean)
        : (req.body.staff_emails ? String(req.body.staff_emails).split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : (hospital.staff_emails || []));
    
    const combinedStaff = [
      ...incomingStaffDoctors,
      ...incomingStaffEmails.map(e => ({ email: e }))
    ];
    if (combinedStaff.length > 0) {
      await syncHospitalStaff(req.body.name || hospital.name, combinedStaff, hospital._id);
    }

    if (req.body.specialities !== undefined) {
      hospital.specialities = req.body.specialities;
      hospital.markModified('specialities');
    }
    if (req.body.reels !== undefined) {
      hospital.reels = Array.isArray(req.body.reels) ? req.body.reels : [];
      hospital.markModified('reels');
    }
    if (req.body.youtube_videos !== undefined) {
      hospital.youtube_videos = Array.isArray(req.body.youtube_videos) ? req.body.youtube_videos : [];
      hospital.markModified('youtube_videos');
    }
    if (req.body.star_doctors !== undefined) {
      const resolvedStarDoctors = [];
      const inputStarDoctors = Array.isArray(req.body.star_doctors) ? req.body.star_doctors : [];
      for (const sd of inputStarDoctors) {
        if (/^[0-9a-fA-F]{24}$/.test(sd)) {
          resolvedStarDoctors.push(sd);
        } else if (typeof sd === 'string' && sd.includes('@')) {
          const doc = await Doctor.findOne({ email: sd.trim().toLowerCase() });
          if (doc) resolvedStarDoctors.push(doc._id);
        }
      }
      hospital.star_doctors = resolvedStarDoctors;
      hospital.markModified('star_doctors');
    }
    if (req.body.photos !== undefined) {
      hospital.photos = Array.isArray(req.body.photos) ? req.body.photos : [];
      hospital.markModified('photos');
    }
    if (req.body.staff_doctors !== undefined) {
      hospital.staff_doctors = incomingStaffDoctors;
      hospital.markModified('staff_doctors');
    }
    if (req.body.staff_emails !== undefined) {
      hospital.staff_emails = incomingStaffEmails;
      hospital.markModified('staff_emails');
    }
    if (req.body.cashlessInsurance !== undefined) {
      hospital.cashlessInsurance = Boolean(req.body.cashlessInsurance);
    }
    if (req.body.acceptedInsurances !== undefined) {
      hospital.acceptedInsurances = Array.isArray(req.body.acceptedInsurances) ? req.body.acceptedInsurances : [];
      hospital.markModified('acceptedInsurances');
    }
    if (req.body.tpaHelpdesk !== undefined) {
      hospital.tpaHelpdesk = req.body.tpaHelpdesk;
      hospital.markModified('tpaHelpdesk');
    }
    if (req.body.insuranceHelpline !== undefined) {
      hospital.insuranceHelpline = req.body.insuranceHelpline;
    }
    if (req.file) {
      hospital.image = req.file.path;
    } else if (req.body.image) {
      hospital.image = req.body.image;
    }
    
    const updatedHospital = await hospital.save();

    const populated = await Hospital.findById(updatedHospital._id).select('-password').populate('star_doctors', '-password');
    broadcastDbChange('hospitals', 'update', updatedHospital._id, populated || updatedHospital);
    res.json({ success: true, message: 'Hospital updated', data: populated || updatedHospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Administrator privileges required to delete a hospital'
      });
    }

    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] });
    }
    if (hospital) {
      const hospId = hospital._id;
      await hospital.deleteOne();
      broadcastDbChange('hospitals', 'delete', hospId);
      res.json({ success: true, message: 'Hospital deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update FAQs for a doctor registered under this hospital
 */
export const updateDoctorFaqsByHospital = async (req, res) => {
  const { hospitalId, doctorId } = req.params;
  const { faqs } = req.body;

  try {
    const isHospital = req.user && req.user.role === 'hospital';
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isHospital && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to hospitals and administrators'
      });
    }

    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ name: new RegExp(`^${hospitalId}$`, 'i') });
    }

    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctor = await Doctor.findById(doctorId);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Verify doctor is registered under this hospital
    if (hospital) {
      const hospitalName = hospital.name.toLowerCase().trim();
      const docHospital = (doctor.hospital || '').toLowerCase().trim();
      const isAffiliated = docHospital === hospitalName || !docHospital || (hospital.staff_doctors || []).some(
        sd => (typeof sd === 'string' ? sd : sd?.email)?.toLowerCase() === doctor.email?.toLowerCase()
      );

      if (!isAffiliated && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: `Doctor ${doctor.name} is not registered under ${hospital.name}. Only their registered hospital or an admin can update their FAQs.`
        });
      }
    }

    doctor.faqs = Array.isArray(faqs) ? faqs : [];
    doctor.markModified('faqs');
    const updated = await doctor.save();

    return res.json({
      success: true,
      message: `Doctor FAQs updated successfully by ${hospital ? hospital.name : 'Hospital'}`,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
