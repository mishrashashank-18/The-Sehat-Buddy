import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import generateToken from '../utils/generateToken.js';

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

    const isFirstLogin = Boolean(doctor.isFirstLogin || !doctor.passwordSet);

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
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    Object.assign(doctor, req.body);
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
