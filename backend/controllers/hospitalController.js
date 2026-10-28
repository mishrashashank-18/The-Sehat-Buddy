import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import validatePassword from '../utils/validatePassword.js';
import { broadcastDbChange } from '../services/storageMonitor.js';
import { extractCloudinaryPublicId, getCloudinary } from '../routes/uploadRoutes.js';
import { generateTemporaryPassword, sendDoctorWelcomeEmail } from '../utils/doctorAuthUtils.js';
import { purgeDoctorPermanently } from '../services/doctorPurgeService.js';
import { calculateHospitalProfileCompletion, normalizeAndValidatePhone, validateBedCapacity, MIN_PROFILE_COMPLETION_THRESHOLD } from '../utils/hospitalProfileCompletion.js';

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
        Hospital.updateOne({ _id: hospital._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }).catch(() => {});
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
        Hospital.updateOne({ _id: hospital._id }, { $set: { lockUntil: new Date(Date.now() + 15 * 60 * 1000), failedLoginAttempts: 0 } }).catch(() => {});
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      Hospital.updateOne({ _id: hospital._id }, { $set: { failedLoginAttempts: hospital.failedLoginAttempts } }).catch(() => {});
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
      
      const temporaryPassword = generateTemporaryPassword();
      const newDoc = await Doctor.create({
        name: formattedName,
        email: cleanEmail,
        password: temporaryPassword,
        specialization: 'General Physician',
        experience: 5,
        fees: 500,
        price: 500,
        hospital: hospitalName,
        isFirstLogin: true,
        passwordSet: false,
        about: `Clinical specialist affiliated with ${hospitalName}.`
      });

      // Dispatch welcome email with temporary password to doctor
      sendDoctorWelcomeEmail({ doctor: newDoc, temporaryPassword, hospitalName });
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
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Official hospital email is required' });
    }

    const hospitalExists = await Hospital.findOne({ email: cleanEmail });
    if (hospitalExists) {
      return res.status(400).json({ success: false, message: 'Hospital already exists with this email address' });
    }
    
    let cleanPhone = phone || '';
    if (cleanPhone) {
      const phoneValidation = normalizeAndValidatePhone(cleanPhone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ success: false, message: phoneValidation.error });
      }
      cleanPhone = phoneValidation.normalized;
    } else {
      return res.status(400).json({ success: false, message: 'Official hospital contact number is required (10 digits)' });
    }

    const candidateTotal = totalBeds !== undefined && totalBeds !== '' && !isNaN(Number(totalBeds)) ? Number(totalBeds) : 0;
    const candidateAvailable = req.body.availableBeds !== undefined && req.body.availableBeds !== '' && !isNaN(Number(req.body.availableBeds)) ? Number(req.body.availableBeds) : 0;
    const bedValidation = validateBedCapacity(candidateTotal, candidateAvailable);
    if (!bedValidation.valid) {
      return res.status(400).json({ success: false, message: bedValidation.error });
    }

    // Generate secure, user-friendly temporary password if not explicitly provided
    let temporaryPassword = password;
    if (!temporaryPassword || temporaryPassword === 'CHANGEME_PENDING_SETUP') {
      const randStr = Math.random().toString(36).substring(2, 6);
      const randNum = Math.floor(100 + Math.random() * 900);
      temporaryPassword = `Sehat@${randStr}${randNum}`;
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
      if (!sd) continue;
      const rawId = (typeof sd === 'object' && sd !== null) ? (sd._id || sd.id) : sd;
      const rawEmail = (typeof sd === 'object' && sd !== null) ? sd.email : (typeof sd === 'string' && sd.includes('@') ? sd : null);
      const rawName = (typeof sd === 'object' && sd !== null) ? sd.name : null;

      let foundDoctor = null;
      if (rawId && typeof rawId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawId)) {
        foundDoctor = await Doctor.findById(rawId);
      }
      if (!foundDoctor && (rawId || rawEmail || rawName)) {
        const orConditions = [];
        if (rawId) orConditions.push({ id: rawId }, { id: String(rawId) });
        if (rawEmail) orConditions.push({ email: String(rawEmail).trim().toLowerCase() });
        if (rawName) orConditions.push({ name: String(rawName).trim() });
        foundDoctor = await Doctor.findOne({ $or: orConditions });
      }
      if (foundDoctor) {
        resolvedStarDoctors.push(foundDoctor._id);
      } else if (rawId && typeof rawId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawId)) {
        resolvedStarDoctors.push(rawId);
      }
    }

    // Deduplicate star doctors
    const uniqueStarDoctors = [];
    const seenStarIds = new Set();
    for (const sid of resolvedStarDoctors) {
      const sidStr = String(sid);
      if (!seenStarIds.has(sidStr)) {
        seenStarIds.add(sidStr);
        uniqueStarDoctors.push(sid);
      }
    }

    const hospitalDraft = { 
      name, 
      email: cleanEmail, 
      password: temporaryPassword, 
      address: address || '', 
      city: city || 'Delhi', 
      state: state || '', 
      zip: zip || '', 
      phone: cleanPhone, 
      description: description || '', 
      specialities: Array.isArray(parsedSpecialities) ? parsedSpecialities : [], 
      image: image || '',
      photos: Array.isArray(req.body.photos) ? req.body.photos : [],
      rating: rating !== undefined && rating !== null && !isNaN(Number(rating)) ? Number(rating) : 0,
      reviews: reviews || '0 Reviews',
      totalBeds: bedValidation.total,
      availableBeds: bedValidation.available,
      emptyBeds: bedValidation.available,
      emergency24x7: emergency24x7 !== undefined ? Boolean(emergency24x7) : false,
      establishedYear: establishedYear ? Number(establishedYear) : undefined,
      showOnHome: req.body.showOnHome !== undefined ? Boolean(req.body.showOnHome) : true,
      homeUpdatedAt: Date.now(),
      isVerified: Boolean(req.body.isVerified),
      isFirstLogin: false,
      passwordSet: true,
      reels: reels || [],
      youtube_videos: youtube_videos || [],
      star_doctors: uniqueStarDoctors,
      staff_emails: parsedStaffEmails,
      staff_doctors: parsedStaffDoctors,
      cashlessInsurance: req.body.cashlessInsurance !== undefined ? Boolean(req.body.cashlessInsurance) : false,
      acceptedInsurances: Array.isArray(req.body.acceptedInsurances) ? req.body.acceptedInsurances : [],
      tpaHelpdesk: req.body.tpaHelpdesk || {
        phone: '',
        email: '',
        preAuthTime: ''
      },
      insuranceHelpline: req.body.insuranceHelpline || '',
      latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : undefined,
      erCases: Array.isArray(req.body.erCases) ? req.body.erCases : [],
      ambulances: Array.isArray(req.body.ambulances) ? req.body.ambulances : [],
      status: req.body.status || 'active'
    };

    const initialCompletion = calculateHospitalProfileCompletion(hospitalDraft);
    hospitalDraft.profileCompletion = initialCompletion.percentage;
    hospitalDraft.publicationStatus = req.body.publicationStatus || (initialCompletion.percentage >= MIN_PROFILE_COMPLETION_THRESHOLD && req.body.isVerified ? 'published' : 'draft');

    const hospital = await Hospital.create(hospitalDraft);
    
    if (hospital) {
      broadcastDbChange('hospitals', 'insert', hospital._id, hospital);

      // Determine Hospital Portal URL
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const portalLoginUrl = `${clientUrl}/hospital`;

      // Dispatch welcome credentials email via Brevo in background
      sendEmail({
        email: hospital.email,
        subject: `Welcome to Sehat Buddy — ${hospital.name} Hospital Portal Credentials`,
        message: `Hello ${hospital.name},\n\nYour hospital facility has been successfully registered on the Sehat Buddy healthcare platform.\n\nYou can access your Hospital Management Portal using the following credentials:\n\nPortal URL: ${portalLoginUrl}\nLogin Email: ${hospital.email}\nTemporary Password: ${temporaryPassword}\n\nPlease log in and update your profile, manage doctors, and change your password for security.\n\nWarm regards,\nThe Sehat Buddy Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">The Sehat Buddy</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Hospital Partner Onboarding</p>
            </div>
            <div style="padding: 32px 28px; color: #1e293b; line-height: 1.6;">
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #0f172a;">Welcome, ${hospital.name}!</h2>
              <p style="margin: 0 0 20px; font-size: 15px; color: #475569;">
                Your healthcare facility has been successfully onboarded on <strong>The Sehat Buddy</strong> network. You now have full access to your dedicated Hospital Management Portal.
              </p>
              
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 14px; font-size: 15px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Your Portal Login Credentials</h3>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 13px; color: #64748b; display: block;">Portal Login URL:</span>
                  <a href="${portalLoginUrl}" style="font-size: 14px; color: #2563eb; font-weight: 600; text-decoration: none;">${portalLoginUrl}</a>
                </div>
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 13px; color: #64748b; display: block;">Official Email (Login ID):</span>
                  <span style="font-size: 15px; color: #0f172a; font-weight: 600; font-family: monospace;">${hospital.email}</span>
                </div>
                <div>
                  <span style="font-size: 13px; color: #64748b; display: block;">Temporary Password:</span>
                  <span style="font-size: 16px; color: #dc2626; font-weight: 700; font-family: monospace; letter-spacing: 0.5px; background: #fee2e2; padding: 4px 10px; border-radius: 6px; display: inline-block;">${temporaryPassword}</span>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalLoginUrl}" style="background: #2563eb; color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                  Access Hospital Portal &rarr;
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; font-size: 13px; color: #64748b;">
                <p style="margin: 0 0 8px;"><strong>Security Tip:</strong> For your facility's safety, please log in and update your password under Hospital Profile settings.</p>
                <p style="margin: 0;">Need assistance? Contact our hospital partner support at <a href="mailto:thesehatbuddy@gmail.com" style="color: #2563eb;">thesehatbuddy@gmail.com</a>.</p>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              &copy; ${new Date().getFullYear()} The Sehat Buddy Healthcare Platform. All rights reserved.
            </div>
          </div>
        `
      }).then(() => {
        console.log(`✓ Welcome email successfully dispatched to hospital: ${hospital.email}`);
      }).catch(emailErr => {
        console.error(`Failed to dispatch welcome email to ${hospital.email}:`, emailErr.message);
      });

      res.status(201).json({
        success: true,
        message: 'Hospital registered successfully. Portal login credentials have been emailed.',
        token: generateToken(hospital._id),
        data: hospital,
        temporaryPassword: temporaryPassword
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
    const isPublicOnly = req.query.public === 'true';
    let query = {};
    if (isPublicOnly) {
      query = {
        $or: [
          { publicationStatus: 'published' },
          { publicationStatus: { $exists: false } },
          { publicationStatus: null }
        ]
      };
    }
    const hospitals = await Hospital.find(query).select('-password').populate('star_doctors', '-password');
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    let hospital = null;
    const reqId = String(req.params.id || '').trim();
    if (mongoose.Types.ObjectId.isValid(reqId)) {
      hospital = await Hospital.findById(reqId).select('-password').populate('star_doctors', '-password');
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: reqId }, { email: reqId }] }).select('-password').populate('star_doctors', '-password');
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isSelf = req.user && (
      req.user.id === hospital._id.toString() ||
      req.user._id?.toString() === hospital._id.toString() ||
      (req.user.email && hospital.email && req.user.email.toLowerCase() === hospital.email.toLowerCase())
    );

    const isPublished = (
      hospital.status === 'active' &&
      hospital.publicationStatus === 'published' &&
      (hospital.profileCompletion || 0) >= MIN_PROFILE_COMPLETION_THRESHOLD
    );

    // If unpublished or incomplete and explicitly requested by public patient view
    const isExplicitlyPublic = req.query.public === 'true';
    if (isExplicitlyPublic && !isPublished && !isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'This hospital profile is currently unpublished or pending completion review.'
      });
    }

    // Attach latest live profile completion breakdown for dashboard
    const completion = calculateHospitalProfileCompletion(hospital);
    const hospObj = hospital.toObject();
    hospObj.profileCompletion = completion.percentage;
    hospObj.isEligibleForPublication = completion.isEligibleForPublication;
    hospObj.missingRequirements = completion.missingRequirements;
    hospObj.completionBreakdown = completion.breakdown;

    res.json({ success: true, data: hospObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get profile of currently authenticated hospital
 */
export const getMyHospital = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized: Bearer token required' });
    }
    const hospital = await Hospital.findById(req.user.id).select('-password').populate('star_doctors', '-password');
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Authenticated hospital record not found' });
    }

    const completion = calculateHospitalProfileCompletion(hospital);
    const hospObj = hospital.toObject();
    hospObj.profileCompletion = completion.percentage;
    hospObj.isEligibleForPublication = completion.isEligibleForPublication;
    hospObj.missingRequirements = completion.missingRequirements;
    hospObj.completionBreakdown = completion.breakdown;

    return res.json({ success: true, data: hospObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHospital = async (req, res) => {
  try {
    if (req.body && req.body.__v !== undefined) {
      delete req.body.__v;
    }
    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] });
    }
    if (!hospital && req.body?.email) {
      hospital = await Hospital.findOne({ email: String(req.body.email).toLowerCase().trim() });
    }
    if (!hospital && req.body?.name) {
      hospital = await Hospital.findOne({ name: String(req.body.name).trim() });
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Bearer token required to update hospital details'
      });
    }

    // Authorization verification: hospital itself or platform admin
    const isSelf = (
      req.user.id === hospital._id.toString() ||
      req.user._id?.toString() === hospital._id.toString() ||
      (req.user.email && hospital.email && req.user.email.toLowerCase() === hospital.email.toLowerCase())
    );
    const isAdmin = req.user.role === 'admin' || req.headers['x-admin-request'] === 'true';
    const isHospitalAdmin = req.user.role === 'hospital';

    if (!isAdmin && (!isHospitalAdmin || !isSelf)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify another hospital profile'
      });
    }

    // Backend Security Check: Hospital admins cannot add, edit, or delete Reels or Videos
    if (isHospitalAdmin && !isAdmin) {
      if (req.body.reels !== undefined) {
        const existingReelsStr = JSON.stringify(hospital.reels || []);
        let incomingReelsStr = '';
        if (Array.isArray(req.body.reels)) {
          incomingReelsStr = JSON.stringify(req.body.reels);
        } else if (typeof req.body.reels === 'string') {
          try {
            incomingReelsStr = JSON.stringify(JSON.parse(req.body.reels));
          } catch {
            incomingReelsStr = JSON.stringify(req.body.reels.split(/\s+/).filter(Boolean));
          }
        }
        if (existingReelsStr !== incomingReelsStr) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Hospital administrators are not authorized to add, edit, or delete Reels. Only website administrators can modify media.'
          });
        }
      }

      if (req.body.youtube_videos !== undefined) {
        const existingVideosStr = JSON.stringify(hospital.youtube_videos || []);
        let incomingVideosStr = '';
        if (Array.isArray(req.body.youtube_videos)) {
          incomingVideosStr = JSON.stringify(req.body.youtube_videos);
        } else if (typeof req.body.youtube_videos === 'string') {
          try {
            incomingVideosStr = JSON.stringify(JSON.parse(req.body.youtube_videos));
          } catch {
            incomingVideosStr = JSON.stringify(req.body.youtube_videos.split(/\s+/).filter(Boolean));
          }
        }
        if (existingVideosStr !== incomingVideosStr) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Hospital administrators are not authorized to add, edit, or delete YouTube Videos. Only website administrators can modify media.'
          });
        }
      }
    }

    // STRICT WHITELIST: Prevent mass assignment of sensitive/credential fields
    const allowedFields = [
      'name', 'email', 'address', 'city', 'state', 'zip', 'description',
      'rating', 'reviews', 'emergency24x7', 'establishedYear',
      'cashlessInsurance', 'insuranceHelpline', 'latitude', 'longitude',
      'instagram', 'facebook', 'erCases', 'ambulances'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'establishedYear') {
          hospital[field] = Number(req.body[field]);
        } else {
          hospital[field] = req.body[field];
        }
        hospital.markModified(field);
      }
    });

    // Validate phone number strictly (10-digit Indian mobile)
    if (req.body.phone !== undefined) {
      const phoneValidation = normalizeAndValidatePhone(req.body.phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ success: false, message: phoneValidation.error });
      }
      hospital.phone = phoneValidation.normalized;
      hospital.markModified('phone');
    }

    // Validate bed capacity strictly (totalBeds >= 1, availableBeds >= 0, availableBeds <= totalBeds)
    if (req.body.totalBeds !== undefined || req.body.availableBeds !== undefined || req.body.emptyBeds !== undefined) {
      const candidateTotal = req.body.totalBeds !== undefined ? req.body.totalBeds : hospital.totalBeds;
      const incomingAvail = req.body.availableBeds !== undefined 
        ? req.body.availableBeds 
        : (req.body.emptyBeds !== undefined ? req.body.emptyBeds : hospital.availableBeds);

      const bedValidation = validateBedCapacity(candidateTotal, incomingAvail);
      if (!bedValidation.valid) {
        return res.status(400).json({ success: false, message: bedValidation.error });
      }
      hospital.totalBeds = bedValidation.total;
      hospital.availableBeds = bedValidation.available;
      hospital.emptyBeds = bedValidation.available;
      hospital.markModified('totalBeds');
      hospital.markModified('availableBeds');
      hospital.markModified('emptyBeds');
    }

    // Publication Status & Verification Workflow
    if (isAdmin) {
      if (req.body.isVerified !== undefined) {
        hospital.isVerified = Boolean(req.body.isVerified);
        hospital.markModified('isVerified');
      }
      if (req.body.publicationStatus !== undefined && ['draft', 'pending_review', 'published', 'suspended'].includes(req.body.publicationStatus)) {
        hospital.publicationStatus = req.body.publicationStatus;
        hospital.markModified('publicationStatus');
      }
      if (req.body.status !== undefined && ['active', 'suspended', 'deactivated'].includes(req.body.status)) {
        hospital.status = req.body.status;
        hospital.markModified('status');
      }
      if (req.body.showOnHome !== undefined) {
        const incomingHomeTs = req.body.homeMutationTimestamp !== undefined ? Number(req.body.homeMutationTimestamp) : null;
        const existingHomeTs = Number(hospital.homeUpdatedAt || 0);
        const targetVal = Boolean(req.body.showOnHome);
        const existingVal = hospital.showOnHome !== false;

        // If showOnHome value is identical and no explicit timestamp was provided, skip updating homeUpdatedAt
        if (incomingHomeTs === null && targetVal === existingVal) {
          // No-op: value unchanged, avoid creating artificial timestamp drift
        } else if (incomingHomeTs && existingHomeTs && incomingHomeTs <= existingHomeTs) {
          // Stale request discarded
        } else {
          const targetHomeTs = incomingHomeTs || Math.max(Date.now(), existingHomeTs + 1);
          // Atomic conditional update directly on MongoDB Atlas
          const atomicHomeRes = await Hospital.findOneAndUpdate(
            {
              _id: hospital._id,
              $or: [
                { homeUpdatedAt: { $lt: targetHomeTs } },
                { homeUpdatedAt: { $exists: false } },
                { homeUpdatedAt: null },
                { homeUpdatedAt: 0 }
              ]
            },
            {
              $set: {
                showOnHome: targetVal,
                homeUpdatedAt: targetHomeTs
              }
            },
            { returnDocument: 'after' }
          );

          if (atomicHomeRes) {
            hospital.showOnHome = atomicHomeRes.showOnHome;
            hospital.homeUpdatedAt = atomicHomeRes.homeUpdatedAt;
          } else {
            const latestHosp = await Hospital.findById(hospital._id);
            if (latestHosp) {
              hospital.showOnHome = latestHosp.showOnHome;
              hospital.homeUpdatedAt = latestHosp.homeUpdatedAt;
            }
          }
          hospital.markModified('showOnHome');
          hospital.markModified('homeUpdatedAt');
        }
      }
    } else if (isHospitalAdmin) {
      if (req.body.publicationStatus === 'pending_review' || req.body.publicationStatus === 'published') {
        const previewCompletion = calculateHospitalProfileCompletion(hospital);
        if (previewCompletion.percentage < MIN_PROFILE_COMPLETION_THRESHOLD) {
          return res.status(400).json({
            success: false,
            message: `Profile completion is currently at ${previewCompletion.percentage}%. Your hospital profile must reach at least ${MIN_PROFILE_COMPLETION_THRESHOLD}% to be eligible for publication. Missing: ${previewCompletion.missingRequirements.slice(0, 2).join(', ')}.`
          });
        }
        hospital.publicationStatus = req.body.publicationStatus;
        hospital.markModified('publicationStatus');
      }
    }

    // Direct staff synchronization WITHOUT resurrecting deleted doctors
    if (req.body.staff_doctors !== undefined) {
      hospital.staff_doctors = Array.isArray(req.body.staff_doctors) ? req.body.staff_doctors : [];
      hospital.markModified('staff_doctors');
    }
    if (req.body.staff_emails !== undefined) {
      const parsedEmails = Array.isArray(req.body.staff_emails)
        ? req.body.staff_emails.map(e => e.trim().toLowerCase()).filter(Boolean)
        : (req.body.staff_emails ? String(req.body.staff_emails).split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : []);
      hospital.staff_emails = parsedEmails;
      hospital.markModified('staff_emails');
    }

    if (req.body.specialities !== undefined) {
      hospital.specialities = Array.isArray(req.body.specialities) ? req.body.specialities : [];
      hospital.markModified('specialities');
    } else if (req.body.specialties !== undefined) {
      hospital.specialities = Array.isArray(req.body.specialties) ? req.body.specialties : [];
      hospital.markModified('specialities');
    }
    if (isAdmin) {
      if (req.body.reels !== undefined) {
        let incomingReels = [];
        if (Array.isArray(req.body.reels)) {
          incomingReels = req.body.reels;
        } else if (typeof req.body.reels === 'string') {
          try {
            const parsed = JSON.parse(req.body.reels);
            incomingReels = Array.isArray(parsed) ? parsed : [req.body.reels];
          } catch {
            incomingReels = req.body.reels.split(/\s+/).filter(Boolean);
          }
        } else {
          incomingReels = [];
        }
        hospital.reels = incomingReels;
        hospital.markModified('reels');

        // Automatic background conversion of Instagram links to Cloudinary direct video
        (async () => {
          try {
            let changed = false;
            const updatedReels = [...hospital.reels];
            for (let i = 0; i < updatedReels.length; i++) {
              const r = updatedReels[i];
              const rUrl = typeof r === 'string' ? r : r?.url;
              if (rUrl && rUrl.includes('instagram.com') && !rUrl.includes('cloudinary.com')) {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execPromise = promisify(exec);
                const os = await import('os');
                const path = await import('path');
                const fs = await import('fs');

                const tempFilePath = path.join(os.tmpdir(), `sehat_bg_reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`);
                const cleanReelUrl = String(rUrl).trim().split('?')[0];

                const commands = [
                  `yt-dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanReelUrl}"`,
                  `python3 -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanReelUrl}"`,
                  `python -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanReelUrl}"`,
                  `py -m yt_dlp --no-warnings --no-check-certificates -o "${tempFilePath}" "${cleanReelUrl}"`
                ];
                let downloaded = false;
                for (const cmd of commands) {
                  try {
                    await execPromise(cmd, { timeout: 20000 });
                    if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 1000) {
                      downloaded = true;
                      break;
                    }
                  } catch {}
                }
                if (downloaded && fs.existsSync(tempFilePath)) {
                  try {
                    const { getCloudinary } = await import('../routes/uploadRoutes.js');
                    const cld = getCloudinary();
                    const cldRes = await cld.uploader.upload(tempFilePath, {
                      resource_type: 'video',
                      folder: 'sehatbuddy/reels'
                    });
                    if (cldRes && cldRes.secure_url) {
                      updatedReels[i] = {
                        url: cldRes.secure_url,
                        coverPhoto: cldRes.secure_url.replace(/\.[^/.]+$/, '.jpg')
                      };
                      changed = true;
                    }
                  } finally {
                    try {
                      if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                      }
                    } catch {}
                  }
                }
              }
            }
            if (changed) {
              await Hospital.updateOne({ _id: hospital._id }, { $set: { reels: updatedReels } });
              broadcastDbChange('hospitals', 'update', hospital._id, { ...hospital.toObject(), reels: updatedReels });
            }
          } catch (cldErr) {
            console.warn('Background reel Cloudinary conversion warning:', cldErr.message);
          }
        })().catch(() => {});
      }
      if (req.body.youtube_videos !== undefined) {
        if (Array.isArray(req.body.youtube_videos)) {
          hospital.youtube_videos = req.body.youtube_videos;
        } else if (typeof req.body.youtube_videos === 'string') {
          try {
            const parsed = JSON.parse(req.body.youtube_videos);
            hospital.youtube_videos = Array.isArray(parsed) ? parsed : [req.body.youtube_videos];
          } catch {
            hospital.youtube_videos = req.body.youtube_videos.split(/\s+/).filter(Boolean);
          }
        } else {
          hospital.youtube_videos = [];
        }
        hospital.markModified('youtube_videos');
      }
    }
    if (req.body.star_doctors !== undefined) {
      const resolvedStarDoctors = [];
      const inputStarDoctors = Array.isArray(req.body.star_doctors) ? req.body.star_doctors : [];
      for (const sd of inputStarDoctors) {
        if (!sd) continue;
        const rawId = (typeof sd === 'object' && sd !== null) ? (sd._id || sd.id) : sd;
        const rawEmail = (typeof sd === 'object' && sd !== null) ? sd.email : (typeof sd === 'string' && sd.includes('@') ? sd : null);
        const rawName = (typeof sd === 'object' && sd !== null) ? sd.name : null;

        let foundDoctor = null;
        if (rawId && typeof rawId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawId)) {
          foundDoctor = await Doctor.findById(rawId);
        }
        if (!foundDoctor && (rawId || rawEmail || rawName)) {
          const orConditions = [];
          if (rawId) orConditions.push({ id: rawId }, { id: String(rawId) });
          if (rawEmail) orConditions.push({ email: String(rawEmail).trim().toLowerCase() });
          if (rawName) orConditions.push({ name: String(rawName).trim() });
          foundDoctor = await Doctor.findOne({ $or: orConditions });
        }
        if (foundDoctor) {
          resolvedStarDoctors.push(foundDoctor._id);
        } else if (rawId && typeof rawId === 'string' && /^[0-9a-fA-F]{24}$/.test(rawId)) {
          resolvedStarDoctors.push(rawId);
        }
      }

      // Deduplicate star doctors
      const uniqueStarDoctors = [];
      const seenStarIds = new Set();
      for (const sid of resolvedStarDoctors) {
        const sidStr = String(sid);
        if (!seenStarIds.has(sidStr)) {
          seenStarIds.add(sidStr);
          uniqueStarDoctors.push(sid);
        }
      }

      // Identify added and removed doctor IDs for bidirectional synchronization
      const oldStarDoctors = (hospital.star_doctors || []).map(sid => String(sid));
      const newStarDoctorStrings = new Set(uniqueStarDoctors.map(sid => String(sid)));
      const removedDoctorIds = oldStarDoctors.filter(oldId => !newStarDoctorStrings.has(oldId));

      hospital.star_doctors = uniqueStarDoctors;
      hospital.markModified('star_doctors');

      // Bidirectional synchronization: keep Doctor.isStarDoctor strictly aligned with Hospital.star_doctors
      const nowTs = Date.now();
      if (uniqueStarDoctors.length > 0) {
        Doctor.updateMany(
          { _id: { $in: uniqueStarDoctors } },
          { $set: { isStarDoctor: true, starUpdatedAt: nowTs } }
        ).catch(err => console.warn('Sync Doctor.isStarDoctor true failed:', err.message));
      }

      if (removedDoctorIds.length > 0) {
        (async () => {
          for (const remId of removedDoctorIds) {
            if (!mongoose.Types.ObjectId.isValid(remId)) continue;
            try {
              const otherHospitalHas = await Hospital.exists({
                _id: { $ne: hospital._id },
                star_doctors: remId
              });
              if (!otherHospitalHas) {
                await Doctor.updateOne(
                  { _id: remId },
                  { $set: { isStarDoctor: false, starUpdatedAt: nowTs } }
                );
              }
            } catch (syncErr) {
              console.warn('Sync Doctor.isStarDoctor false failed:', syncErr.message);
            }
          }
        })();
      }
    }
    if (req.body.photos !== undefined) {
      hospital.photos = Array.isArray(req.body.photos) ? req.body.photos : [];
      hospital.markModified('photos');
    }
    if (req.body.cashlessInsurance !== undefined) {
      hospital.cashlessInsurance = Boolean(req.body.cashlessInsurance);
      hospital.markModified('cashlessInsurance');
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
      hospital.markModified('insuranceHelpline');
    }
    const incomingImage = req.file ? req.file.path : req.body.image;
    if (incomingImage && incomingImage !== hospital.image) {
      if (hospital.image && typeof hospital.image === 'string' && hospital.image.includes('cloudinary.com')) {
        const oldPublicId = extractCloudinaryPublicId(hospital.image);
        if (oldPublicId) {
          try {
            const cld = getCloudinary();
            await cld.uploader.destroy(oldPublicId, { resource_type: 'image', invalidate: true });
          } catch (cldErr) {
            console.warn('Failed to delete old hospital photo from Cloudinary:', cldErr.message);
          }
        }
      }
      hospital.image = incomingImage;
      hospital.markModified('image');
    }

    // Recalculate profile completion dynamically from persisted state
    const completion = calculateHospitalProfileCompletion(hospital);
    hospital.profileCompletion = completion.percentage;
    hospital.markModified('profileCompletion');

    // Auto-update publication status if completion falls below threshold
    if (hospital.publicationStatus === 'published' && completion.percentage < MIN_PROFILE_COMPLETION_THRESHOLD) {
      hospital.publicationStatus = 'draft';
      hospital.markModified('publicationStatus');
    }
    
    // If this request did not explicitly modify showOnHome, re-fetch the latest state from MongoDB
    // to guarantee concurrent Running/Hidden toggles are never overwritten by hospital.save()
    if (req.body.showOnHome === undefined) {
      const freshHomeState = await Hospital.findById(hospital._id).select('showOnHome homeUpdatedAt');
      if (freshHomeState) {
        hospital.showOnHome = freshHomeState.showOnHome;
        hospital.homeUpdatedAt = freshHomeState.homeUpdatedAt;
      }
    }

    let updatedHospital;
    try {
      updatedHospital = await hospital.save();
    } catch (saveErr) {
      if (saveErr.name === 'VersionError' || saveErr.message?.includes('No matching document')) {
        const fresh = await Hospital.findById(hospital._id);
        if (fresh) {
          allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) fresh[field] = req.body[field];
          });
          if (isAdmin && req.body.showOnHome !== undefined) {
            fresh.showOnHome = Boolean(req.body.showOnHome);
            if (hospital.homeUpdatedAt) fresh.homeUpdatedAt = hospital.homeUpdatedAt;
          }
          if (isAdmin && req.body.publicationStatus !== undefined) fresh.publicationStatus = req.body.publicationStatus;
          if (isAdmin && req.body.status !== undefined) fresh.status = req.body.status;
          if (req.body.totalBeds !== undefined) fresh.totalBeds = Number(req.body.totalBeds);
          if (req.body.availableBeds !== undefined) {
            fresh.availableBeds = Number(req.body.availableBeds);
            fresh.emptyBeds = Number(req.body.availableBeds);
          }
          fresh.profileCompletion = calculateHospitalProfileCompletion(fresh).percentage;
          updatedHospital = await fresh.save();
        } else {
          throw saveErr;
        }
      } else {
        throw saveErr;
      }
    }

    const populated = await Hospital.findById(updatedHospital._id).select('-password').populate('star_doctors', '-password');
    const populatedObj = populated ? populated.toObject() : updatedHospital.toObject();
    populatedObj.profileCompletion = completion.percentage;
    populatedObj.isEligibleForPublication = completion.isEligibleForPublication;
    populatedObj.missingRequirements = completion.missingRequirements;
    populatedObj.completionBreakdown = completion.breakdown;

    broadcastDbChange('hospitals', 'update', updatedHospital._id, populatedObj);
    res.json({
      success: true,
      message: 'Hospital details updated successfully',
      data: populatedObj
    });
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

      // Permanently remove all hospital photos from Cloudinary
      const imagesToDelete = [
        hospital.image,
        ...(Array.isArray(hospital.interior_photos) ? hospital.interior_photos : []),
        ...(Array.isArray(hospital.exterior_photos) ? hospital.exterior_photos : []),
        ...(Array.isArray(hospital.photos) ? hospital.photos : [])
      ].filter(Boolean);

      if (imagesToDelete.length > 0) {
        try {
          const cld = getCloudinary();
          for (const imgUrl of imagesToDelete) {
            if (typeof imgUrl === 'string' && imgUrl.includes('cloudinary.com')) {
              const publicId = extractCloudinaryPublicId(imgUrl);
              if (publicId) {
                await cld.uploader.destroy(publicId, { resource_type: 'image', invalidate: true }).catch(() => {});
              }
            }
          }
        } catch (cldErr) {
          console.warn('Failed to clean up hospital photos from Cloudinary:', cldErr.message);
        }
      }

      await hospital.deleteOne();
      broadcastDbChange('hospitals', 'delete', hospId);
      res.json({ success: true, message: 'Hospital and associated assets deleted permanently' });
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
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: FAQs can be edited only by admin'
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
    broadcastDbChange('doctors', 'update', updated._id, updated);

    return res.json({
      success: true,
      message: 'Doctor FAQs updated successfully by Admin',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// LIVE BED CAPACITY (Live Inpatient Capacity from MongoDB)
export const getHospitalBeds = async (req, res) => {
  try {
    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id).select('name totalBeds availableBeds emptyBeds');
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] }).select('name totalBeds availableBeds emptyBeds');
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    const totalBeds = hospital.totalBeds !== undefined ? Number(hospital.totalBeds) : 100;
    const availableBeds = hospital.availableBeds !== undefined ? Number(hospital.availableBeds) : (hospital.emptyBeds !== undefined ? Number(hospital.emptyBeds) : 24);
    res.json({
      success: true,
      data: {
        id: hospital._id,
        name: hospital.name,
        totalBeds,
        availableBeds,
        emptyBeds: availableBeds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHospitalBeds = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized: Bearer token required' });
    }
    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      hospital = await Hospital.findById(req.params.id);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: req.params.id }, { email: req.params.id }] });
    }
    if (!hospital && req.body?.email) {
      hospital = await Hospital.findOne({ email: String(req.body.email).toLowerCase().trim() });
    }
    if (!hospital && req.body?.name) {
      hospital = await Hospital.findOne({ name: String(req.body.name).trim() });
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.headers['x-admin-request'] === 'true';
    const isSelf = (
      req.user.id === hospital._id.toString() ||
      req.user._id?.toString() === hospital._id.toString() ||
      (req.user.email && hospital.email && req.user.email.toLowerCase() === hospital.email.toLowerCase())
    );

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify bed capacity for another hospital'
      });
    }

    const candidateTotal = req.body.totalBeds !== undefined ? req.body.totalBeds : hospital.totalBeds;
    const incomingAvailable = req.body.availableBeds !== undefined ? req.body.availableBeds : req.body.emptyBeds;
    const candidateAvailable = incomingAvailable !== undefined ? incomingAvailable : hospital.availableBeds;

    const bedValidation = validateBedCapacity(candidateTotal, candidateAvailable);
    if (!bedValidation.valid) {
      return res.status(400).json({ success: false, message: bedValidation.error });
    }

    hospital.totalBeds = bedValidation.total;
    hospital.availableBeds = bedValidation.available;
    hospital.emptyBeds = bedValidation.available;
    hospital.markModified('totalBeds');
    hospital.markModified('availableBeds');
    hospital.markModified('emptyBeds');

    // Recalculate profile completion
    const completion = calculateHospitalProfileCompletion(hospital);
    hospital.profileCompletion = completion.percentage;
    hospital.markModified('profileCompletion');

    const updated = await hospital.save();
    broadcastDbChange('hospitals', 'update', updated._id, updated);
    res.json({
      success: true,
      message: 'Bed capacity updated successfully',
      data: {
        id: updated._id,
        name: updated.name,
        totalBeds: updated.totalBeds,
        availableBeds: updated.availableBeds,
        emptyBeds: updated.availableBeds,
        profileCompletion: updated.profileCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove doctor specifically from a hospital roster (star doctors, staff doctors, staff emails).
 * Never deletes or alters doctor records belonging to other hospitals.
 */
export const removeDoctorFromHospital = async (req, res) => {
  try {
    const { id: hospitalId, doctorId } = req.params;
    if (!hospitalId || !doctorId) {
      return res.status(400).json({ success: false, message: 'Hospital ID and Doctor ID are required' });
    }

    let hospital = null;
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    }
    if (!hospital) {
      hospital = await Hospital.findOne({ $or: [{ id: hospitalId }, { email: hospitalId }] });
    }
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isSelf = req.user && (
      req.user.id === hospital._id.toString() ||
      req.user._id?.toString() === hospital._id.toString() ||
      (req.user.email && hospital.email && req.user.email.toLowerCase() === hospital.email.toLowerCase())
    );

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this hospital roster'
      });
    }

    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctor = await Doctor.findById(doctorId);
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ id: doctorId });
    }
    if (!doctor && doctorId.includes('@')) {
      doctor = await Doctor.findOne({ email: doctorId.toLowerCase().trim() });
    }

    const docObjectId = doctor ? doctor._id : (mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null);
    const docEmail = doctor ? (doctor.email || '').toLowerCase().trim() : (doctorId.includes('@') ? doctorId.toLowerCase().trim() : null);

    // 1. Remove from star_doctors
    if (docObjectId) {
      hospital.star_doctors = (hospital.star_doctors || []).filter(sd => String(sd) !== String(docObjectId));
      hospital.markModified('star_doctors');
    }

    // 2. Remove from staff_doctors & staff_emails
    if (docEmail) {
      hospital.staff_doctors = (hospital.staff_doctors || []).filter(sd => {
        const sdEmail = (typeof sd === 'string' ? sd : sd?.email)?.toLowerCase().trim();
        return sdEmail !== docEmail;
      });
      hospital.markModified('staff_doctors');

      hospital.staff_emails = (hospital.staff_emails || []).filter(em => {
        const e = (typeof em === 'string' ? em : em?.email)?.toLowerCase().trim();
        return e !== docEmail;
      });
      hospital.markModified('staff_emails');
    }

    // 3. If doctor was created specifically for this hospital or has no other hospital affiliations, permanently purge doctor, email logs, and account
    if (doctor) {
      const docHosp = String(doctor.hospital || '').trim().toLowerCase();
      const thisHospName = String(hospital.name || '').trim().toLowerCase();
      const thisHospId = String(hospital._id || hospital.id || '').trim().toLowerCase();

      const otherHospitalCount = await Hospital.countDocuments({
        _id: { $ne: hospital._id },
        $or: [
          { star_doctors: doctor._id },
          { 'staff_doctors.email': docEmail },
          { staff_emails: docEmail }
        ]
      });

      if ((docHosp === thisHospName || docHosp === thisHospId || !docHosp) && otherHospitalCount === 0) {
        try {
          await purgeDoctorPermanently(doctor);
        } catch (purgeErr) {
          console.warn('Purge doctor notice on hospital roster removal:', purgeErr.message);
        }
      }
    }

    // Recalculate profile completion
    const completion = calculateHospitalProfileCompletion(hospital);
    hospital.profileCompletion = completion.percentage;
    hospital.markModified('profileCompletion');

    const updated = await hospital.save();
    broadcastDbChange('hospitals', 'update', updated._id, updated);

    return res.json({
      success: true,
      message: 'Doctor removed from hospital roster successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
