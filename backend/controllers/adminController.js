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
import { generateTemporaryPassword, sendDoctorWelcomeEmail } from '../utils/doctorAuthUtils.js';
import { purgeDoctorPermanently } from '../services/doctorPurgeService.js';
import { parseAvailableDaysAndHours } from '../utils/doctorScheduleUtils.js';

export const generateStandardDoctorFaqs = (docName) => {
  const cleanName = (docName || '').trim().startsWith('Dr.') ? (docName || '').trim() : `Dr. ${(docName || 'the doctor').trim()}`;
  return [
    {
      q: `How can I book an appointment with ${cleanName}?`,
      question: `How can I book an appointment with ${cleanName}?`,
      a: `You can book an in-clinic consultation or instant video appointment with ${cleanName} directly on The Sehat Buddy platform. Select your preferred date and time slot for instant confirmation.`,
      answer: `You can book an in-clinic consultation or instant video appointment with ${cleanName} directly on The Sehat Buddy platform. Select your preferred date and time slot for instant confirmation.`,
      category: 'Booking & Schedule',
      icon: 'calendar',
      image: ''
    },
    {
      q: 'What do I need to show at the clinic?',
      question: 'What do I need to show at the clinic?',
      a: 'Please carry a valid government photo ID (Aadhar Card, PAN Card, or Passport), your health insurance policy e-card if claiming cashless coverage, and any previous doctor prescriptions, discharge summaries, or diagnostic reports related to your consultation.',
      answer: 'Please carry a valid government photo ID (Aadhar Card, PAN Card, or Passport), your health insurance policy e-card if claiming cashless coverage, and any previous doctor prescriptions, discharge summaries, or diagnostic reports related to your consultation.',
      category: 'Clinic Preparation',
      icon: 'document',
      image: ''
    },
    {
      q: 'Is my consultation private with the doctor?',
      question: 'Is my consultation private with the doctor?',
      a: 'Yes, 100%. All consultations, patient notes, medical records, and discussions are strictly confidential and protected under standard healthcare privacy regulations.',
      answer: 'Yes, 100%. All consultations, patient notes, medical records, and discussions are strictly confidential and protected under standard healthcare privacy regulations.',
      category: 'Privacy & Security',
      icon: 'shield',
      image: ''
    },
    {
      q: `Can I reschedule my appointment with ${cleanName}?`,
      question: `Can I reschedule my appointment with ${cleanName}?`,
      a: 'Yes, you can easily reschedule or cancel your appointment prior to your slot time through your patient account dashboard or by reaching out to our support care desk.',
      answer: 'Yes, you can easily reschedule or cancel your appointment prior to your slot time through your patient account dashboard or by reaching out to our support care desk.',
      category: 'Rescheduling Policy',
      icon: 'reschedule',
      image: ''
    },
    {
      q: `Does ${cleanName} accept health insurance or cashless claims?`,
      question: `Does ${cleanName} accept health insurance or cashless claims?`,
      a: 'Yes, consultations and any recommended clinical procedures or treatments performed at our partner hospitals qualify for 100% cashless mediclaim pre-authorization with all leading insurance TPAs.',
      answer: 'Yes, consultations and any recommended clinical procedures or treatments performed at our partner hospitals qualify for 100% cashless mediclaim pre-authorization with all leading insurance TPAs.',
      category: 'Cashless Insurance',
      icon: 'insurance',
      image: ''
    }
  ];
};

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
    const {
      name,
      email,
      specialization,
      specialty,
      experience,
      experienceYears,
      about,
      fees,
      price,
      address,
      reels,
      youtube_videos,
      instagram,
      facebook,
      rating,
      reviews,
      hospital,
      qualifications,
      degree,
      contact_number,
      phone,
      available,
      availableDays,
      isStarDoctor,
      faqs,
      awards,
      certifications,
      memberships,
      careerExperience,
      tags
    } = req.body;

    let image = req.body.image || '';
    if (req.file) {
      image = req.file.path;
    }
    
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Doctor email address is required' });
    }

    const existingDoctor = await Doctor.findOne({ email: cleanEmail });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: 'A doctor account is already registered with this email address' });
    }

    let parsedAddress = {};
    if (address) {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    }

    const temporaryPassword = generateTemporaryPassword();
    const newDocId = new mongoose.Types.ObjectId();
    const docSpecialty = specialization || specialty || 'General Medicine';
    const docExp = Number(experience) || Number(experienceYears) || 5;
    const docFee = Number(fees) || Number(price) || 500;
    const docDegree = qualifications || degree || '';
    const docPhone = contact_number || phone || '';

    let initPct = 0;
    if ((name || '').trim().length >= 2) initPct += 10;
    if (cleanEmail && cleanEmail.includes('@')) initPct += 10;
    if (String(docPhone).replace(/\D/g, '').length >= 10) initPct += 10;
    if (docSpecialty.trim().length >= 3) initPct += 10;
    if (hospital && hospital.trim().length >= 2) initPct += 10;
    if (req.body.licenseNumber && req.body.licenseNumber.trim().length >= 3) initPct += 15;
    if (docDegree.trim().length >= 2) initPct += 10;
    if (about && about.trim().length >= 20) initPct += 10;
    if (image && image.trim().length > 0) initPct += 10;
    if (availableDays) initPct += 5;

    const parsedSched = parseAvailableDaysAndHours(availableDays || 'Mon - Sat (10am - 4pm)', 30);
    const finalScheduleDays = (Array.isArray(req.body.scheduleDays) && req.body.scheduleDays.length > 0) ? req.body.scheduleDays : parsedSched.days;
    const finalAvailableSlots = (Array.isArray(req.body.availableSlots) && req.body.availableSlots.length > 0) ? req.body.availableSlots : parsedSched.slots;

    const doctor = await Doctor.create({
      _id: newDocId,
      id: newDocId.toString(),
      name: (name || '').trim(),
      email: cleanEmail,
      password: temporaryPassword,
      isFirstLogin: true,
      passwordSet: false,
      specialization: docSpecialty,
      specialty: docSpecialty,
      experience: docExp,
      jobTitle: (req.body.jobTitle || '').trim(),
      about: about || '',
      fees: docFee,
      price: docFee,
      address: parsedAddress,
      image,
      reels: Array.isArray(reels) ? reels : [],
      youtube_videos: Array.isArray(youtube_videos) ? youtube_videos : [],
      instagram: instagram || '',
      facebook: facebook || '',
      rating: rating !== undefined && !isNaN(Number(rating)) ? Number(rating) : 0,
      reviews: reviews !== undefined ? String(reviews) : '0',
      hospital: hospital || '',
      qualifications: docDegree,
      degree: docDegree,
      contact_number: docPhone,
      phone: docPhone,
      available: available !== undefined ? available : true,
      availableDays: availableDays || 'Mon - Sat (10am - 4pm)',
      scheduleDays: finalScheduleDays,
      availableSlots: finalAvailableSlots,
      isStarDoctor: Boolean(isStarDoctor),
      starUpdatedAt: Date.now(),
      profileCompletion: Math.min(100, initPct),
      isProfileComplete: initPct >= 80,
      faqs: Array.isArray(faqs) ? faqs.filter(f => (f?.q || f?.question || '').trim() !== '') : [],
      awards: Array.isArray(awards) ? awards.filter(Boolean) : [],
      certifications: Array.isArray(certifications) ? certifications.filter(Boolean) : [],
      memberships: Array.isArray(memberships) ? memberships.filter(Boolean) : [],
      careerExperience: Array.isArray(careerExperience) ? careerExperience.filter(Boolean) : [],
      tags: Array.isArray(tags) ? tags.filter(Boolean) : []
    });

    // Sync hospital staff roster if hospital is specified
    if (hospital && typeof hospital === 'string' && hospital.trim()) {
      try {
        const cleanHosp = hospital.trim();
        const hospitalFilter = mongoose.Types.ObjectId.isValid(cleanHosp)
          ? { $or: [{ _id: cleanHosp }, { name: { $regex: new RegExp(`^${cleanHosp}$`, 'i') } }] }
          : { name: { $regex: new RegExp(`^${cleanHosp}$`, 'i') } };

        const hospDoc = await Hospital.findOne(hospitalFilter);
        if (hospDoc) {
          if (!Array.isArray(hospDoc.staff_emails)) hospDoc.staff_emails = [];
          if (!hospDoc.staff_emails.includes(cleanEmail)) {
            hospDoc.staff_emails.push(cleanEmail);
          }
          if (!Array.isArray(hospDoc.staff_doctors)) hospDoc.staff_doctors = [];
          if (!hospDoc.staff_doctors.some(d => d.email === cleanEmail)) {
            hospDoc.staff_doctors.push({ name: doctor.name, email: cleanEmail });
          }
          if (Boolean(isStarDoctor)) {
            if (!Array.isArray(hospDoc.star_doctors)) hospDoc.star_doctors = [];
            if (!hospDoc.star_doctors.some(id => String(id) === String(doctor._id))) {
              hospDoc.star_doctors.push(doctor._id);
            }
          }
          await hospDoc.save();
          broadcastDbChange('hospitals', 'update', hospDoc._id, hospDoc);
        }
      } catch (hospSyncErr) {
        console.warn('Failed to sync doctor to hospital in MongoDB:', hospSyncErr.message);
      }
    }

    // Send temporary password credentials email to the doctor
    sendDoctorWelcomeEmail({ doctor, temporaryPassword, hospitalName: hospital });

    broadcastDbChange('doctors', 'insert', doctor._id, doctor);
    res.status(201).json({
      success: true,
      message: 'Doctor added successfully and saved to database',
      data: doctor,
      temporaryPassword
    });
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

const doctorMutationQueues = new Map();

export const serializeDoctorMutation = (docId, fn) => {
  const key = String(docId || 'global');
  const prevPromise = doctorMutationQueues.get(key) || Promise.resolve();
  const nextPromise = prevPromise
    .catch(() => {})
    .then(fn);
  doctorMutationQueues.set(key, nextPromise);
  nextPromise.finally(() => {
    if (doctorMutationQueues.get(key) === nextPromise) {
      doctorMutationQueues.delete(key);
    }
  });
  return nextPromise;
};

export const updateDoctor = async (req, res) => {
  const reqId = String(req.params.id).trim();
  return serializeDoctorMutation(reqId, async () => {
    try {
      let doctor = null;
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
      const oldEmail = (doctor.email || '').toLowerCase().trim();
      const newEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : null;
      let emailChanged = false;
      let temporaryPassword = null;

      if (newEmail && newEmail !== oldEmail) {
        // Ensure no duplicate doctor account with this email
        const duplicateDoctor = await Doctor.findOne({
          email: newEmail,
          _id: { $ne: doctor._id }
        });
        if (duplicateDoctor) {
          return res.status(400).json({
            success: false,
            message: `Email ${newEmail} is already registered to another doctor (${duplicateDoctor.name}).`
          });
        }

        // Generate temporary password for newly registered/changed email
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

        // Keep hospital staff rosters in sync
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

      const incomingStar = req.body.isStarDoctor;
      const incomingStarTimestamp = req.body.starMutationTimestamp !== undefined ? Number(req.body.starMutationTimestamp) : null;
      const existingStar = Boolean(doctor.isStarDoctor);
      const existingStarTimestamp = Number(doctor.starUpdatedAt || 0);

      const safeBody = { ...req.body };
      delete safeBody.isStarDoctor;
      delete safeBody.starMutationTimestamp;
      delete safeBody.starUpdatedAt;

      Object.assign(doctor, safeBody);
      if (emailChanged) {
        doctor.email = newEmail;
      }

      if (!doctor.id && reqId) {
        doctor.id = reqId;
        doctor.markModified('id');
      }

      if (req.body.name !== undefined) {
        doctor.name = String(req.body.name).trim();
        doctor.markModified('name');
      }

      if (req.body.specialty !== undefined || req.body.specialization !== undefined) {
        const spec = req.body.specialization || req.body.specialty;
        doctor.specialty = spec;
        doctor.specialization = spec;
        doctor.markModified('specialty');
        doctor.markModified('specialization');
      } else if (doctor.specialization && (!doctor.specialty || doctor.specialty === 'General Medicine' || doctor.specialty !== doctor.specialization)) {
        doctor.specialty = doctor.specialization;
        doctor.markModified('specialty');
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

      if (req.body.phone !== undefined || req.body.contact_number !== undefined) {
        const ph = String(req.body.phone !== undefined ? req.body.phone : req.body.contact_number).trim();
        doctor.phone = ph;
        doctor.contact_number = ph;
        doctor.markModified('phone');
        doctor.markModified('contact_number');
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

      if (incomingStar !== undefined) {
        const targetTimestamp = incomingStarTimestamp || Math.max(Date.now(), existingStarTimestamp + 1);
        if (incomingStarTimestamp && existingStarTimestamp && incomingStarTimestamp <= existingStarTimestamp) {
          doctor.isStarDoctor = existingStar;
          doctor.starUpdatedAt = existingStarTimestamp;
        } else {
          // Perform atomic conditional write directly on MongoDB Atlas
          // Guarantees ordering across multi-process Node.js clusters and multiple server instances
          const atomicStarRes = await Doctor.findOneAndUpdate(
            {
              _id: doctor._id,
              $or: [
                { starUpdatedAt: { $lt: targetTimestamp } },
                { starUpdatedAt: { $exists: false } },
                { starUpdatedAt: null },
                { starUpdatedAt: 0 }
              ]
            },
            {
              $set: {
                isStarDoctor: Boolean(incomingStar),
                starUpdatedAt: targetTimestamp
              }
            },
            { new: true }
          );

          if (atomicStarRes) {
            doctor.isStarDoctor = atomicStarRes.isStarDoctor;
            doctor.starUpdatedAt = atomicStarRes.starUpdatedAt;
          } else {
            // A newer mutation already committed in MongoDB; refresh local doctor instance
            const latestDoc = await Doctor.findById(doctor._id);
            doctor.isStarDoctor = latestDoc ? latestDoc.isStarDoctor : existingStar;
            doctor.starUpdatedAt = latestDoc ? latestDoc.starUpdatedAt : existingStarTimestamp;
          }
          doctor.markModified('isStarDoctor');
          doctor.markModified('starUpdatedAt');

          // Bidirectional synchronization: keep Hospital.star_doctors strictly in sync with Doctor.isStarDoctor
          try {
            if (Boolean(doctor.isStarDoctor)) {
              if (doctor.hospital) {
                await Hospital.updateMany(
                  { $or: [{ name: doctor.hospital }, { _id: mongoose.Types.ObjectId.isValid(doctor.hospital) ? doctor.hospital : null }] },
                  { $addToSet: { star_doctors: doctor._id } }
                );
              }
            } else {
              await Hospital.updateMany(
                { star_doctors: doctor._id },
                { $pull: { star_doctors: doctor._id } }
              );
            }
          } catch (hospSyncErr) {
            console.warn('Hospital star_doctors sync warning in updateDoctor:', hospSyncErr.message);
          }
        }
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
      if (req.body.jobTitle !== undefined) {
        doctor.jobTitle = String(req.body.jobTitle || '').trim();
        doctor.markModified('jobTitle');
      }
      if (req.body.availableDays !== undefined) {
        doctor.availableDays = req.body.availableDays;
        doctor.markModified('availableDays');

        const parsedSched = parseAvailableDaysAndHours(req.body.availableDays, doctor.slotDuration || 30);
        if (req.body.scheduleDays !== undefined && Array.isArray(req.body.scheduleDays) && req.body.scheduleDays.length > 0) {
          doctor.scheduleDays = req.body.scheduleDays.filter(Boolean);
        } else {
          doctor.scheduleDays = parsedSched.days;
        }
        doctor.markModified('scheduleDays');

        if (req.body.availableSlots !== undefined && Array.isArray(req.body.availableSlots) && req.body.availableSlots.length > 0) {
          doctor.availableSlots = req.body.availableSlots.filter(Boolean);
        } else if (parsedSched.slots.length > 0) {
          doctor.availableSlots = parsedSched.slots;
        }
        doctor.markModified('availableSlots');
      } else {
        if (req.body.scheduleDays !== undefined) {
          doctor.scheduleDays = Array.isArray(req.body.scheduleDays) ? req.body.scheduleDays.filter(Boolean) : [];
          doctor.markModified('scheduleDays');
        }
        if (req.body.availableSlots !== undefined) {
          doctor.availableSlots = Array.isArray(req.body.availableSlots) ? req.body.availableSlots.filter(Boolean) : [];
          doctor.markModified('availableSlots');
        }
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
      // Compute Profile Completion Percentage (0-100%)
      const isRahul = doctor.email === 'dr.rahul@sehatbuddy.com' || (doctor.name && doctor.name.toLowerCase().includes('rahul verma'));
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

      // If this request did NOT explicitly modify star status, re-fetch the latest star values from MongoDB
      // to ensure concurrent star toggles are never overwritten by doctor.save()
      if (incomingStar === undefined) {
        const freshStarState = await Doctor.findById(doctor._id).select('isStarDoctor starUpdatedAt');
        if (freshStarState) {
          doctor.isStarDoctor = freshStarState.isStarDoctor;
          doctor.starUpdatedAt = freshStarState.starUpdatedAt;
        }
      }

      const updatedDoctor = await doctor.save();

      if (emailChanged && temporaryPassword) {
        sendDoctorWelcomeEmail({
          doctor: updatedDoctor,
          temporaryPassword,
          hospitalName: updatedDoctor.hospital || req.body.hospital || 'The Sehat Buddy Network'
        }).catch(emailErr => {
          console.error('Failed to send credential email to updated doctor email:', emailErr.message);
        });
      }

      broadcastDbChange('doctors', 'update', updatedDoctor._id, updatedDoctor);
      res.json({
        success: true,
        message: emailChanged
          ? `Doctor email updated to ${updatedDoctor.email} and temporary password sent successfully!`
          : 'Doctor updated successfully',
        data: updatedDoctor,
        temporaryPassword: temporaryPassword || undefined,
        emailChanged
      });
    } else {
      res.status(404).json({ success: false, message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  });
};

export const deleteDoctor = async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Doctor ID or email is required' });
    }

    const result = await purgeDoctorPermanently(rawId);
    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Doctor not found in database' });
    }

    return res.json({
      success: true,
      message: 'Doctor and all associated database records (including email logs, user account, appointments, and hospital roster entries) deleted permanently'
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
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
    const appointments = await Appointment.find().sort({ createdAt: -1, date: -1 }).lean();
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
